/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import EventEmitter from 'events';
import pako from 'pako';
import type Client from '../Client/Client.js';
import { DefaultWebsocketSettings, ServerOpCodes } from '../Utils/Constants.js';
import type { ConnectionType, Encoding, Status, WebsocketSettings } from '../types/Misc/ConfigTypes';
import type { Auth } from '../types/Websocket/Payloads/Auth.js';
import Payloads from './Payloads.js';

interface Websocket {
	emit(event: 'open'): boolean;
	emit(event: 'authed', data: Auth): boolean;
	on(event: 'open', listener: () => void): this;
	on(event: 'authed', listener: (data: Auth) => void): this;
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

		this.Status = 'disconnected';

		this.Client = client ?? null;

		this.Payloads = new Payloads(this, true);

		this.HeartBeating = null;
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

	public connect(token?: string) {
		if (token) {
			this.Token = token;
		}

		if (!this.Token) {
			throw new Error('[Wrapper] [Websocket] No token provided');
		}

		this.Gateway = new WebSocket(`${this.Url}/${this.ConnectionType}?v=${this.Version}&encoding=${this.Encoding}`);

		this.handleWebsocket();

		this.Status = 'connecting';

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

					console.log('[Wrapper] [Websocket] We have been authed', Payload);

					this.SessionId = Data.SessionId;
					this.HeartbeatInterval = Data.HeartbeatInterval;
					this.Sequence = 1;
					this.LastHeartbeatAck = Date.now();
					this.LastHeartbeatSent = Date.now();
					this.Status = 'ready';

					this.HeartBeating = setInterval(() => {
						console.log('[Wrapper] [Websocket] Sending heartbeat');
						this.Payloads.Heartbeat();
						this.LastHeartbeatSent = Date.now();
					}, this.HeartbeatInterval);

					console.log('[Wrapper] [Websocket] Heartbeat interval set to', this.HeartbeatInterval);

					this.emit('authed', Data);

					break;
				}

				case 'HeartBeatAck': {
					this.LastHeartbeatAck = Date.now();

					console.log('[Wrapper] [Websocket] Heartbeat acked');

					break;
				}

				default: {
					console.log(`Unhandled payload: ${PayloadName ?? Payload?.op}`, Payload);
				}
			}
		};
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
				console.warn(`[Wrapper] [Websocket] Error parsing message`, error);

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
									console.warn(`[Wrapper] [Websocket] Error parsing message`, error);

									resolve(null);
								}
							} else {
								try {
									const parsed = JSON.parse(decompressed.toString());

									resolve(parsed);
								} catch (error) {
									console.warn(`[Wrapper] [Websocket] Error parsing message`, error);

									resolve(null);
								}
							}
						}
					} else {
						try {
							const parsed = JSON.parse(data.toString());

							resolve(parsed);
						} catch (error) {
							console.warn(`[Wrapper] [Websocket] Error parsing message`, error);

							resolve(null);
						}
					}
				};
			});
		} else {
			console.warn(`[Wrapper] [Websocket] Unknown Payload type, here we go`, message);

			return null;
		}
	}
}

export default Websocket;

export { Websocket };
