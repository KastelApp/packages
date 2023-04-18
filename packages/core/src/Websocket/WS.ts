import type { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import type http from 'node:http';
import process from 'node:process';
import { setInterval } from 'node:timers';
import WebSocket from 'ws';
import Errors from './Errors.js';
import Events from './EventsHandler.js';
import User from './User.js';
import Utils, { HardCloseCodes, AuthCodes, Regexes, SoftCloseCodes } from './Utils.js';

export interface WebsocketServer {
	emit(event: 'connection', user: User): boolean;
	emit(event: 'debug', message: string[] | string): boolean;
	emit(event: 'error', error: Error, user?: User): boolean;
	emit(event: 'close', user: User, expecting: boolean): boolean;
	on(event: 'connection', listener: (user: User) => void): this;
	on(event: 'debug', listener: (message: string[] | string) => void): this;
	on(event: 'error', listener: (error: Error, user?: User) => void): this;
	on(event: 'close', listener: (user: User, expecting: boolean) => void): this;
}

export class WebsocketServer extends EventEmitter {
	public connectedUsers: Map<string, User>;

	public ws: WebSocket.Server | null;

	public server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;

	public port: number | null;

	public allowedIps: string[];

	public closeOnError: boolean;

	public debugEnabled: boolean;

	public maxPerIp: number;

	public maxConnectionsPerMinute: number;

	public heartbeatInterval: number;

	public closedInterval: number;

	public unauthedTimeout: number;

	public constructor(init: http.Server | number, allowedIps: string[], closeOnError: boolean, debug?: boolean) {
		super();

		this.connectedUsers = new Map();

		this.ws = null;

		this.server = typeof init === 'number' ? null : init;

		this.port = typeof init === 'number' ? init : null;

		if (!this.port && !this.server) {
			throw new Error('Invalid port or server');
		}

		this.allowedIps = allowedIps;

		this.closeOnError = closeOnError;

		this.debugEnabled = debug ?? false;

		this.maxPerIp = 10; // only 5 connections per ip (This is a BAD solution, but it works for now)

		this.maxConnectionsPerMinute = 5; // the max connections per minute per ip (meaning 5 people can connect in 1 minute, but 6th will be disconnected)

		this.heartbeatInterval = 1_000 * 1; // 1 second

		this.closedInterval = 1_000 * 5; // 5 seconds

		this.unauthedTimeout = 1_000 * 10; // 10 seconds
	}

	public createWs(): WebSocket.Server {
		const wss = new WebSocket.Server(
			this.server
				? {
						server: this.server as http.Server,
				  }
				: {
						port: this.port as number,
				  },
		);

		this.ws = wss;

		wss.on('connection', (socket, req) => {
			const ip = req.socket.remoteAddress as string;

			const ipConnections = Array.from(this.connectedUsers.values()).filter((usr) => usr.Ip === ip);

			if (ipConnections.length >= this.maxPerIp) {
				// (M) = IP (max connections reached)
				socket.send(new Errors('Invalid request (M)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.debug(`Max connections reached for ${ip}`);

				return;
			}

			const lastMinuteConnections = ipConnections.filter((usr) => usr.ConnectedAt >= Date.now() - 60_000);

			if (lastMinuteConnections.length >= this.maxConnectionsPerMinute) {
				// (MX) = IP (max connections reached)
				socket.send(new Errors('Invalid request (MX)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.debug(`Max connections reached for ${ip} in the last minute`);

				return;
			}

			this.debug(`New connection from ${ip}`);

			if (this.allowedIps.length > 0 && !this.allowedIps.includes(ip as string)) {
				// (P) = IP (not allowed)
				socket.send(new Errors('Invalid request (P)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.debug(`Connection from ${ip} was not allowed`);

				return;
			}

			const clientOrBot = req.url?.match(Regexes.Type);
			const params = req.url?.match(Regexes.Params);

			if (!clientOrBot || !params) {
				// (T) = Type (not found)
				socket.send(new Errors('Invalid request (T)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.debug(`Was not client or bot from ${ip}`);

				return;
			}

			socket.id = Utils.GenerateSessionId();

			const user = new User(socket.id, socket, false, ip);

			user.setAuth(
				clientOrBot[0] === '/bot' ? AuthCodes.Bot : clientOrBot[0] === '/system' ? AuthCodes.System : AuthCodes.User,
			);

			user.setParams(Utils.ParamsToObject(params.map((parm) => parm.replace(/^[&?]/, ''))));

			const usersParams = user.Params as {
				encoding?: string; // encoding (should always be json for now)
				v?: string; // version
			};

			if (!usersParams.encoding || usersParams.encoding !== 'json') {
				// (EN) = Encoding (not json)

				user.close(HardCloseCodes.InvalidRequest, 'Invalid request (EN)', this.closeOnError);

				this.debug(`Encoding was not json from ${ip}`);

				return;
			}

			if (!usersParams.v) {
				// (V) = Version (not found)

				user.close(HardCloseCodes.InvalidRequest, 'Invalid request (V)', this.closeOnError);

				this.debug(`Version was not found from ${ip}`);

				return;
			}

			user.setEncoding(usersParams.encoding);
			user.setVersion(usersParams.v);

			this.connectedUsers.set(user.Id, user);

			this.emit('connection', user);

			socket.on('close', (code: number) => {
				if (user.Closed || user.ClosedAt) {
					this.emit('close', user, true);
					return; // We were expecting this
				}

				user.close(code, 'Connection closed', false, true);

				this.emit('close', user, false);
			});

			socket.on('message', (data: Buffer) => {
				try {
					const json: {
						d?: any;
						event?: string;
						op?: number;
					} = JSON.parse(data.toString());

					if (!json.event && !json.op) {
						// (E/O) = Event or OP
						user.close(HardCloseCodes.InvalidRequest, 'Invalid request (E/O)', this.closeOnError);

						this.debug(`Event or OP was not found from ${user.Id} (${user.Ip})`);

						return;
					}

					const foundEvent =
						Events.GetEventName(json.event as string, user.SocketVersion as number) ??
						Events.GetEventCode(json.op as number, user.SocketVersion as number);

					if (!foundEvent) {
						// (E) = Event (not found)
						user.close(HardCloseCodes.UnknownOpcode, 'Invalid request (E)', this.closeOnError);

						this.debug(
							`Event was not found from ${user.Id} with the name ${json.event ?? json.op} (${user.Ip}) version: ${
								user.SocketVersion
							}`,
						);

						return;
					}

					if (foundEvent.AuthRequired && !this.connectedUsers.get(socket.id)?.Authed) {
						// (A) = Auth (not authed)
						user.close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.closeOnError);

						this.debug(`Event ${foundEvent.Name} was not authed from ${user.Id} (${user.Ip})`);

						return;
					}

					if (foundEvent.StrictCheck) {
						const validated = Utils.ValidateAuthCode(foundEvent.AllowedAuthTypes, user.AuthType);

						if (!validated) {
							// (A) = Auth (not authed)
							user.close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.closeOnError);

							this.debug(`Event ${foundEvent.Name} was not authed from ${user.Id} (${user.Ip})`);

							return;
						}
					}

					foundEvent.Execute(user, json.d, this.connectedUsers);
				} catch (error: any) {
					this.debug(`Error while parsing JSON from ${ip}: ${error?.message}`);

					this.emit('error', error, user);

					try {
						// (J) = JSON (invalid)
						user.close(HardCloseCodes.DecodeError, 'Invalid request (J)', this.closeOnError);

						this.debug(`JSON was invalid from ${user.Id} (${user.Ip})`);
					} catch {
						this.debug(`User ${ip} has already been closed`);
					}
				}
			});
		});

		wss.on('listening', () => {
			console.log(
				`[Websocket] Websocket is ${this.server ? 'listening on server' : `now listening on port ${this.port}`}`,
			);

			this.startHeartbeatCheck();
			this.clearUsers();
			this.clearConnectedUsers();
		});

		return wss;
	}

	public handleClose(ws: WebSocket.WebSocket) {
		this.debug(`Connection from ${ws.id} has been closed`);

		if (!ws.CLOSED && !ws.CLOSING) ws.close();
	}

	public startHeartbeatCheck() {
		setInterval(() => {
			for (const [id, user] of this.connectedUsers) {
				if (!user.Authed) continue;
				if (!user.HeartbeatInterval || !user.LastHeartbeat) continue;

				if (user.LastHeartbeat + user.HeartbeatInterval + 10_000 < Date.now()) {
					if (process.env.debug) {
						this.debug(
							`User ${id} has not sent a heartbeat in ${
								user.HeartbeatInterval + 10_000
							}ms, closing connection (We got ${this.connectedUsers.size} users left)`,
						);
					}

					user.close(SoftCloseCodes.MissedHeartbeat, 'Missed Heartbeat', false);
				} else if (process.env.debug) {
					this.debug(
						`User ${id} sent a heartbeat at ${new Date(user.LastHeartbeat).toLocaleString()}, which is ${
							Date.now() - user.LastHeartbeat
						}ms ago`,
					);
				}
			}
		}, this.heartbeatInterval);
	}

	public clearUsers() {
		setInterval(() => {
			for (const [id, user] of this.connectedUsers) {
				if (!user.Closed) continue;

				// if they closed more then 8 seconds ago, remove them
				if ((user.ClosedAt as number) + 8_000 < Date.now()) {
					this.connectedUsers.delete(id);
					this.debug(`User ${id} has been removed for being closed (We got ${this.connectedUsers.size} users left)`);
				} else {
					this.debug(`User ${id} has been closed for ${Date.now() - (user.ClosedAt as number)}ms`);
				}
			}
		}, this.closedInterval);
	}

	public clearConnectedUsers() {
		setInterval(() => {
			for (const [id, user] of this.connectedUsers) {
				if (user.Authed) continue;

				// if its been more then 45 seconds since they connected, remove them
				if ((user.ConnectedAt as number) + 45_000 < Date.now()) {
					this.connectedUsers.delete(id);
					user.close(HardCloseCodes.NotAuthenticated, 'Not Authenticated', false);

					this.debug(
						`User ${id} has been removed for being connected and not authed (We got ${this.connectedUsers.size} users left)`,
					);
				} else {
					this.debug(`User ${id} has been connected for ${Date.now() - (user.ConnectedAt as number)}ms`);
				}
			}
		}, this.unauthedTimeout);
	}

	public massSend(data: any) {
		for (const [, user] of this.connectedUsers) {
			user.send(data);
		}
	}

	public masDisconnect(reason: string, code?: number) {
		for (const [, user] of this.connectedUsers) {
			user.close(code ? code : HardCloseCodes.ServerShutdown, reason, false);
		}
	}

	public connectionsByIP(ip: string) {
		let connections = 0;

		for (const [, user] of this.connectedUsers) {
			if (user.Ip === ip) connections++;
		}

		return connections;
	}

	private debug(...args: string[]) {
		// @ts-expect-error - this is a private method, so we can ignore this
		this.emit('debug', ...args);
		if (this.debugEnabled) console.log(...args);
	}
}

export default WebsocketServer;
