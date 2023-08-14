/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import { EventEmitter } from 'events';
import pako from 'pako';
import type Client from '../Client/Client.js';
import { DefaultWebsocketSettings, ServerOpCodes, HardCloseCodes, SoftCloseCodes } from '../Utils/Constants.js';
import StringFormatter from '../Utils/StringFormatter.js';
import type { ConnectionType, Encoding, Status, WebsocketSettings } from '../types/Misc/ConfigTypes';
import { type WorkerData } from '../types/Misc/Worker.d';
import type { Auth } from '../types/Websocket/Payloads/Auth.js';
import Payloads from './Payloads.js';

const OpCodes = {
	Hello: 0, // Worker > Client
	Hey: 1, // Client > Worker
	Heartbeat: 2, // Worker > Client
	Heartbeated: 3, // Client > Worker
};

const minPercentage = 0.7;
const maxPercentage = 1;

interface Websocket {
	emit(event: 'closed' | 'open'): boolean;
	emit(event: 'authed', data: Auth): boolean;
	emit(
		event: 'unauthed',
		data: {
			d: unknown;
			op: (typeof ServerOpCodes)[keyof typeof ServerOpCodes];
			s: number;
		},
	): boolean;
	on(event: 'authed', listener: (data: Auth) => void): this;
	on(event: 'closed' | 'open', listener: () => void): this;
	on(
		event: 'unauthed',
		listener: (data: { d: unknown; op: (typeof ServerOpCodes)[keyof typeof ServerOpCodes]; s: number }) => void,
	): this;
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

	public setToken(token: string) {
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

		console.log(
			this.Gateway,
			this.Client,
			this.Token,
			this.Url,
			this.Version,
			this.Encoding,
			this.Compression,
			this.ConnectionType,
			this.LastHeartbeatAck,
			this.LastHeartbeatSent,
			this.HeartbeatInterval,
			this.Ready,
			this.SessionId,
			this.Sequence,
			this.Status,
		);

		return this.Gateway;
	}

	public disconnect() {
		console.log(this.HeartBeating);
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
				(Op) => ServerOpCodes[Op as keyof typeof ServerOpCodes] === Payload?.op,
			) as keyof typeof ServerOpCodes | undefined;

			if (Payload?.s) this.Sequence = Payload.s;

			switch (PayloadName) {
				case 'Hello': {
					this.Payloads.Identify();
					break;
				}

				case 'Authed': {
					const Data = Payload?.d as Auth;

					this.FailedConnectionAttempts = 0;

					console.log(
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
									console.log(
										`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green(
											'[Websocket]',
										)} ${StringFormatter.yellow('[Worker]')}`,
										"We've been Acknowledged",
									);

									break;
								}

								case 'Heartbeat': {
									console.log(
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
									console.log(
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
							console.log(
								`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
								'Sending heartbeat',
							);

							this.Payloads.Heartbeat();
							this.LastHeartbeatSent = Date.now();
						}, this.HeartbeatInterval * randomPercentage);
					}

					console.log(
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

					console.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'Heartbeat acked',
					);

					break;
				}

				default: {
					console.log(
						`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
						'Unhandled payload:',
						PayloadName ?? Payload?.op,
						Payload,
					);

					if (Payload?.op && Payload.op >= 4_000) {
						console.log(
							`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
							'Unready event emitted',
						);
						this.emit('unauthed', Payload);
					}
				}
			}
		};

		this.Gateway.onclose = (event) => {
			console.log(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
				'Gateway closed, Reconnecting',
			);

			// check if its a soft close or hard close. If its hard set to Reconnecting else set to ReconnectingResumeable (use the softCloseCodes object)
			const { code } = event;

			const IsSoft = Object.entries(SoftCloseCodes).find(([, value]) => value === code);
			const IsHard = Object.entries(HardCloseCodes).find(([, value]) => value === code);

			if (IsSoft) {
				this.Status = 'ReconnectingResumeable';
			}

			if (IsHard) {
				this.Status = 'Reconnecting';
			}

			if (code === 1_006 || code >= 4_000) {
				this.FailedConnectionAttempts++;
			}

			this.emit('closed');

			if (this.FailedConnectionAttempts > this.MaxConnectionAttempts) {
				console.warn(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Max connection attempts reached',
				);
			} else {
				console.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.green('[Websocket]')}`,
					'Attempting to reconnect',
				);
				this.reconnect();
			}
		};
	}

	public reconnect() {
		clearInterval(this.HeartBeating as NodeJS.Timeout);

		this.connect(); // for now
	}

	private async handleWebsocketMessage(message: MessageEvent): Promise<{
		d: unknown;
		op: (typeof ServerOpCodes)[keyof typeof ServerOpCodes];
		s: number;
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
