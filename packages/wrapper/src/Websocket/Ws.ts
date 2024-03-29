/* eslint-disable sonarjs/no-nested-switch */
/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import { EventEmitter } from 'events';
import pako from 'pako';
import type Client from '../Client/Client.js';
import BaseChannel from '../Client/Structures/Channels/BaseChannel.js';
import CategoryChannel from '../Client/Structures/Channels/CategoryChannel.js';
import TextChannel from '../Client/Structures/Channels/TextChannel.js';
import Guild from '../Client/Structures/Guilds/Guild.js';
import { ChannelTypes, DefaultWebsocketSettings, HardCloseCodes, ServerOpCodes } from '../Utils/Constants.js';
import StringFormatter from '../Utils/StringFormatter.js';
import type { ConnectionType, Encoding, Status, WebsocketSettings } from '../types/Misc/ConfigTypes';
import type { WorkerData } from '../types/Misc/index.js';
import type { Guild as GuildType, IdentifyPayload } from '../types/Websocket/Payloads/Auth.js';
import type { ChannelPayload } from '../types/Websocket/Payloads/Channel.js';
import Payloads from './Payloads.js';

const OpCodes = {
	Hello: 0, // Worker > Client
	Hey: 1, // Client > Worker
	Heartbeat: 2, // Worker > Client
	Heartbeated: 3, // Client > Worker
	StopAll: 4, // Client > Worker
};

const minPercentage = 0.7;
const maxPercentage = 1;

interface Websocket {
	emit(event: 'closed' | 'open' | 'unAuthed'): boolean;
	emit(event: 'authed', data: IdentifyPayload): boolean;
	on(event: 'authed', listener: (data: IdentifyPayload) => void): this;
	on(event: 'closed' | 'open' | 'unAuthed', listener: () => void): this;
}

class Websocket extends EventEmitter {
	public Compression: boolean;

	public Encoding: Encoding;

	public Url: string;

	public Version: string;

	public Token: string | null;

	private Gateway: WebSocket | null = null;

	public ConnectionType: ConnectionType; // obv only use client

	// After Connection Stuff

	private LastHeartbeatAck: number;

	private LastHeartbeatSent: number;

	private HeartbeatInterval: number;

	private readonly Ready: boolean;

	private SessionId: string;

	public Sequence: number;

	public Status: Status;

	private Client: Client | null;

	private readonly Payloads: Payloads;

	private HeartBeating: NodeJS.Timeout | null;

	private FailedConnectionAttempts: number;

	private readonly MaxConnectionAttempts: number;

	private Worker: Worker | null;

	private readonly MiniSessionId: string;

	public constructor(options: WebsocketSettings = DefaultWebsocketSettings, client?: Client) {
		super();

		this.Compression = options.Compress;

		this.Encoding = options.Encoding;

		this.Url = options.Url;

		this.Version = options.Version;

		this.Token = null;

		this.Gateway = null;

		this.ConnectionType = 'client';

		this.LastHeartbeatAck = -1;

		this.LastHeartbeatSent = -1;

		this.HeartbeatInterval = -1;

		this.Ready = false;

		this.SessionId = '';

		this.Sequence = -1;

		this.Status = 'Disconnected';

		this.Client = client ?? null;

		this.Payloads = new Payloads(this, true);

		this.HeartBeating = null;

		this.FailedConnectionAttempts = 0;

		this.MaxConnectionAttempts = 5;

		this.Worker = null;

		this.MiniSessionId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
	}

	public setToken(token: string | null) {
		this.Token = token;

		return this;
	}

	public setVersion(version: string) {
		this.Version = version;

		return this;
	}

	public setUrl(url: string) {
		this.Url = url;

		return this;
	}

	public setWorker(worker: Worker | null) {
		this.Worker = worker;

		return this;
	}

	public connect(token?: string) {
		if (token) {
			this.Token = token;
		}

		if (!this.Token) {
			throw new Error('[Wrapper] [Websocket] No token provided');
		}

		this.Gateway = new WebSocket(`${this.Url}/${this.ConnectionType}?v=${this.Version}&encoding=${this.Encoding}`);

		this.handleWebsocket();

		this.Status = 'Connecting';

		StringFormatter.log(
			`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
			'Changing status to Connecting',
		);

		return this.Gateway;
	}

	public disconnect() {
		this.Status = 'DisconnectedOnPurpose';

		this.Gateway?.close();
	}

	public setClient(client: Client) {
		this.Client = client;
	}

	public send(data: string) {
		if (!this.Gateway || this.Gateway.readyState !== WebSocket.OPEN) {
			throw new Error('[Wrapper] [Websocket] No gateway or gateway is not open');
		}

		this.Gateway?.send(data);
	}

	private handleWebsocket() {
		if (!this.Gateway) {
			throw new Error('[Wrapper] [Websocket] No gateway');
		}

		this.Gateway.onopen = () => {
			this.emit('open');
		};

		this.Gateway.onmessage = async (message) => {
			const Payload = await this.handleWebsocketMessage(message);

			const PayloadName: keyof typeof ServerOpCodes | undefined = Object.keys(ServerOpCodes).find(
				(Op) => ServerOpCodes[Op as keyof typeof ServerOpCodes] === Payload?.Op,
			) as keyof typeof ServerOpCodes | undefined;

			if (Payload?.S) this.Sequence = Payload.S;

			switch (PayloadName) {
				case 'Hello': {
					this.Payloads.Identify();
					break;
				}

				case 'Authed': {
					const Data = Payload?.D as IdentifyPayload;

					this.FailedConnectionAttempts = 0;

					StringFormatter.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'We have been authed',
						Payload,
					);

					const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;

					this.SessionId = Data.SessionId;
					this.HeartbeatInterval = Data.HeartbeatInterval * randomPercentage;
					this.Sequence = 1;
					this.LastHeartbeatAck = Date.now();
					this.LastHeartbeatSent = Date.now();
					this.Status = 'Connected'; // Client will handle changing to Ready

					if (this.Worker) {
						this.Worker.postMessage({
							op: OpCodes.Hey,
							data: {
								interval: this.HeartbeatInterval * randomPercentage,
								session: this.MiniSessionId,
							},
						});

						this.Worker.addEventListener('message', (event: { data: WorkerData }) => {
							if (!this.Worker) {
								throw new Error('[Wrapper] [Websocket] No worker');
							}

							// @ts-expect-error -- waffles
							const [eventName, op]: [keyof typeof OpCodes, number] = Object.entries(OpCodes).find(
								([, value]) => value === event.data.op,
							);

							// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check, sonarjs/no-nested-switch
							switch (eventName) {
								case 'Hello': {
									StringFormatter.log(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green(
											'[Websocket]',
										)} ${StringFormatter.yellow('[Worker]')}`,
										"We've been Acknowledged",
									);

									break;
								}

								case 'Heartbeat': {
									StringFormatter.log(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green(
											'[Websocket]',
										)} ${StringFormatter.yellow('[Worker]')}`,
										'We have been asked to heartbeat',
									);

									this.Payloads.Heartbeat();
									this.LastHeartbeatSent = Date.now();

									this.Worker.postMessage({
										op: OpCodes.Heartbeated,
										data: {
											session: this.MiniSessionId,
											interval: this.HeartbeatInterval * randomPercentage,
										},
									});

									break;
								}

								default: {
									StringFormatter.log(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green(
											'[Websocket]',
										)} ${StringFormatter.yellow('[Worker]')}`,
										'Unknown event',
										eventName,
										op,
									);
								}
							}
						});
					} else {
						console.warn(
							`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
							'No worker provided, using interval. Intervals are not recommended due to tab inactivity messing with javascripts timers',
						);
						this.HeartBeating = setInterval(() => {
							StringFormatter.log(
								`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
								'Sending heartbeat',
							);

							this.Payloads.Heartbeat();
							this.LastHeartbeatSent = Date.now();
						}, this.HeartbeatInterval * randomPercentage);
					}

					StringFormatter.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'Heartbeat interval set to',
						this.HeartbeatInterval,
						randomPercentage,
						this.HeartbeatInterval * randomPercentage,
					);

					this.emit('authed', Data);

					break;
				}

				case 'HeartBeatAck': {
					this.LastHeartbeatAck = Date.now();

					StringFormatter.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'Heartbeat acked',
					);

					break;
				}

				case 'Error': {
					const ErrorPayload = Payload?.D as {
						Errors: {
							[Key: string]: {
								Code: number | string;
								Message: string;
							};
						};
					};

					if (ErrorPayload.Errors?.Token) {
						StringFormatter.log(
							`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
							'Invalid token, stopping',
						);

						this.Worker?.postMessage({
							op: OpCodes.StopAll,
							data: {},
						});

						this.Status = 'Failed';

						StringFormatter.log(
							`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
							'Changing Status to Stopped',
						);

						this.emit('unAuthed');

						return;
					}

					StringFormatter.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'We received an error',
						ErrorPayload.Errors,
					);

					break;
				}

				case 'GuildNew': {
					const Data = Payload?.D as GuildType;

					if (this.Client?.guilds.get(Data.Id))
						StringFormatter.log(
							`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
							'Guild already exists',
							Data.Id,
						);
					else this.Client?.guilds.set(Data.Id, new Guild(this.Client, Data));

					break;
				}

				case 'ChannelUpdate':
				case 'ChannelNew': {
					// This is lazy and may cause issues buttttt who cares amirite
					const Data = Payload?.D as ChannelPayload;

					const GuildId = Data.GuildId;

					delete Data.GuildId;

					switch (Data.Type) {
						case ChannelTypes.GuildCategory: {
							this.Client?.channels.set(Data.Id, new CategoryChannel(this.Client, Data, GuildId));

							break;
						}

						case ChannelTypes.GuildText: {
							this.Client?.channels.set(Data.Id, new TextChannel(this.Client, Data, GuildId));

							break;
						}

						default: {
							console.warn(
								`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
								'Unhandled channel type',
								Data.Type,
							);

							this.Client?.channels.set(Data.Id, new BaseChannel(this.Client, Data, GuildId));

							break;
						}
					}

					break;
				}

				default: {
					StringFormatter.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'Unhandled payload:',
						PayloadName ?? Payload?.Op,
						Payload,
					);
				}
			}
		};

		this.Gateway.onclose = (event) => {
			StringFormatter.log(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
				'Gateway closed, Reconnecting',
			);

			if (this.Status === 'DisconnectedOnPurpose') {
				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Gateway closed, not reconnecting',
				);

				this.Worker?.postMessage({
					op: OpCodes.StopAll,
					data: {},
				});

				return;
			}

			// check if its a soft close or hard close. If its hard set to Reconnecting else set to ReconnectingResumeable (use the softCloseCodes object)
			const { code } = event;

			if (
				this.LastHeartbeatAck ||
				this.LastHeartbeatSent ||
				this.Ready ||
				this.SessionId ||
				this.Client ||
				this.FailedConnectionAttempts ||
				this.MaxConnectionAttempts
			) {
				// whar
			}

			if (this.Status === 'Failed') {
				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Gateway closed, not reconnecting',
				);

				return;
			}

			this.FailedConnectionAttempts++;

			if (this.FailedConnectionAttempts >= this.MaxConnectionAttempts) {
				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					`Failed to connect ${this.MaxConnectionAttempts} times, stopping`,
				);

				this.Worker?.postMessage({
					op: OpCodes.StopAll,
					data: {},
				});

				this.Status = 'Failed';

				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Changing Status to Stopped',
				);

				return;
			}

			if (code === 1_006 || Object.values(HardCloseCodes).includes(code)) {
				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					`Gateway closed with an unresumeable code: ${code}, Telling worker to stop`,
				);

				this.Worker?.postMessage({
					op: OpCodes.StopAll,
					data: {},
				});

				this.Status = 'Reconnecting';

				StringFormatter.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Changing Status to Reconnecting',
				);

				this.reconnect(false);
			}

			this.emit('closed');
		};
	}

	public reconnect(Resumeable: boolean) {
		if (this.HeartbeatInterval) {
			clearInterval(this.HeartBeating as NodeJS.Timeout);
		}

		if (Resumeable) {
			StringFormatter.log(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
				'Reconnecting Resumeable',
			);

			// for now nothing
		} else {
			StringFormatter.log(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
				'Reconnecting',
			);

			this.connect();
		}
	}

	private async handleWebsocketMessage(message: MessageEvent): Promise<{
		D: unknown;
		Op: (typeof ServerOpCodes)[keyof typeof ServerOpCodes];
		S: number;
	} | null> {
		if (typeof message.data === 'string') {
			try {
				return JSON.parse(message.data);
			} catch (error) {
				console.warn(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Error parsing message',
					error,
				);

				return null;
			}
		} else if (message.data instanceof Blob) {
			return new Promise((resolve) => {
				const reader = new FileReader();

				reader.readAsArrayBuffer(message.data);

				reader.onload = () => {
					const data = new Uint8Array(reader.result as ArrayBuffer);

					if (this.Compression) {
						const Inflator = new pako.Inflate({
							chunkSize: 65_535,
							to: 'string',
						});

						Inflator.push(data, true);

						const decompressed = Inflator.result;

						if (decompressed) {
							if (typeof decompressed === 'string') {
								try {
									const parsed = JSON.parse(decompressed);

									resolve(parsed);
								} catch (error) {
									console.warn(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
										'Error parsing message',
										error,
									);

									resolve(null);
								}
							} else {
								try {
									const parsed = JSON.parse(decompressed.toString());

									resolve(parsed);
								} catch (error) {
									console.warn(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
										'Error parsing message',
										error,
									);

									resolve(null);
								}
							}
						}
					} else {
						try {
							const parsed = JSON.parse(data.toString());

							resolve(parsed);
						} catch (error) {
							console.warn(
								`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
								'Error parsing message',
								error,
							);

							resolve(null);
						}
					}
				};
			});
		} else {
			console.warn(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
				'Unknown Payload type, here we go',
				message,
			);

			return null;
		}
	}
}

export default Websocket;

export { Websocket };
