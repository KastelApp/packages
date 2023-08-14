import type { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import type http from 'node:http';
import process from 'node:process';
import { setInterval } from 'node:timers';
import WebSocket, { WebSocketServer } from 'ws';
import Errors from './Errors.js';
import Events from './EventsHandler.js';
import User from './User.js';
import Utils, { HardCloseCodes, AuthCodes, Regexes, SoftCloseCodes } from './Utils.js';

const WebsocketServerBuilder = WebSocket.Server ?? WebSocketServer;

export interface WebsocketServer {
	emit(event: 'connection', user: User): boolean;
	emit(event: 'debug', message: string[] | string): boolean;
	emit(event: 'error', error: Error, user?: User): boolean;
	emit(event: 'close', user: User, expecting: boolean): boolean;
	emit(event: 'listening', port: number): boolean;
	on(event: 'connection', listener: (user: User) => void): this;
	on(event: 'debug', listener: (message: string[] | string) => void): this;
	on(event: 'error', listener: (error: Error, user?: User) => void): this;
	on(event: 'close', listener: (user: User, expecting: boolean) => void): this;
	on(event: 'listening', listener: (port: number) => void): this;
}

export class WebsocketServer extends EventEmitter {
	public ConnectedUsers: Map<string, User>;

	public MainSocket: WebSocket.Server | null;

	public Server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;

	public Port: number | null;

	public AllowedIps: string[];

	public CloseOnError: boolean;

	public DebugEnabled: boolean;

	public MaxPerIp: number;

	public MaxConnectionsPerMinute: number;

	public HeartbeatInterval: number;

	public ClosedInterval: number;

	public UnauthedTimeout: number;

	public constructor(init: http.Server | number, allowedIps: string[], closeOnError: boolean, debug?: boolean) {
		super();

		this.ConnectedUsers = new Map();

		this.MainSocket = null;

		this.Server = typeof init === 'number' ? null : init;

		this.Port = typeof init === 'number' ? init : null;

		if (!this.Port && !this.Server) {
			throw new Error('Invalid port or server');
		}

		this.AllowedIps = allowedIps;

		this.CloseOnError = closeOnError;

		this.DebugEnabled = debug ?? false;

		this.MaxPerIp = 10; // only 5 connections per ip (This is a BAD solution, but it works for now)

		this.MaxConnectionsPerMinute = 5; // the max connections per minute per ip (meaning 5 people can connect in 1 minute, but 6th will be disconnected)

		this.HeartbeatInterval = 1_000 * 1; // 1 second

		this.ClosedInterval = 1_000 * 5; // 5 seconds

		this.UnauthedTimeout = 1_000 * 10; // 10 seconds
	}

	public CreateWs(): WebSocket.Server {
		const wss = new WebsocketServerBuilder(
			this.Server
				? {
						server: this.Server as http.Server,
				  }
				: {
						port: this.Port as number,
				  },
		);

		this.MainSocket = wss;

		wss.on('connection', (socket: WebSocket.WebSocket, req) => {
			const ip = req.socket.remoteAddress as string;

			const ipConnections = Array.from(this.ConnectedUsers.values()).filter((usr) => usr.Ip === ip);

			if (ipConnections.length >= this.MaxPerIp) {
				// (M) = IP (max connections reached)
				socket.send(new Errors('Invalid request (M)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.Debug(`Max connections reached for ${ip}`);

				return;
			}

			const lastMinuteConnections = ipConnections.filter((usr) => usr.ConnectedAt >= Date.now() - 60_000);

			if (lastMinuteConnections.length >= this.MaxConnectionsPerMinute) {
				// (MX) = IP (max connections reached)
				socket.send(new Errors('Invalid request (MX)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.Debug(`Max connections reached for ${ip} in the last minute`);

				return;
			}

			this.Debug(`New connection from ${ip}`);

			if (this.AllowedIps.length > 0 && !this.AllowedIps.includes(ip as string)) {
				// (P) = IP (not allowed)
				socket.send(new Errors('Invalid request (P)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.Debug(`Connection from ${ip} was not allowed`);

				return;
			}

			const clientOrBot = req.url?.match(Regexes.Type);
			const params = req.url?.match(Regexes.Params);

			if (!clientOrBot || !params) {
				// (T) = Type (not found)
				socket.send(new Errors('Invalid request (T)').toString());

				socket.close(HardCloseCodes.AuthenticationFailed);

				this.Debug(`Was not client or bot from ${ip}`);

				return;
			}

			socket.id = Utils.GenerateSessionId();

			const user = new User(socket.id, socket, false, ip);

			user.setAuth(
				clientOrBot[0] === '/bot' ? AuthCodes.Bot : clientOrBot[0] === '/system' ? AuthCodes.System : AuthCodes.User,
			);

			user.setParams(Utils.ParseParams(req.url as string));

			const usersParams = user.Params as {
				encoding?: string; // encoding (should always be json for now)
				v?: string; // version
			};

			if (!usersParams.encoding || usersParams.encoding !== 'json') {
				// (EN) = Encoding (not json)

				user.Close(HardCloseCodes.InvalidRequest, 'Invalid request (EN)', this.CloseOnError);

				this.Debug(`Encoding was not json from ${ip}`);

				return;
			}

			if (!usersParams.v) {
				// (V) = Version (not found)

				user.Close(HardCloseCodes.InvalidRequest, 'Invalid request (V)', this.CloseOnError);

				this.Debug(`Version was not found from ${ip}`);

				return;
			}

			user.setEncoding(usersParams.encoding);
			user.setVersion(usersParams.v);

			this.ConnectedUsers.set(user.Id, user);

			this.emit('connection', user);

			socket.on('close', (code: number) => {
				if (user.Closed || user.ClosedAt) {
					this.emit('close', user, true);
					return; // We were expecting this
				}

				user.Close(code, 'Connection closed', false, true);

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
						user.Close(HardCloseCodes.InvalidRequest, 'Invalid request (E/O)', this.CloseOnError);

						this.Debug(`Event or OP was not found from ${user.Id} (${user.Ip})`);

						return;
					}

					const foundEvent =
						Events.GetEventName(json.event as string, user.SocketVersion as number) ??
						Events.GetEventCode(json.op as number, user.SocketVersion as number);

					if (!foundEvent) {
						// (E) = Event (not found)
						user.Close(HardCloseCodes.UnknownOpcode, 'Invalid request (E)', this.CloseOnError);

						this.Debug(
							`Event was not found from ${user.Id} with the name ${json.event ?? json.op} (${user.Ip}) version: ${
								user.SocketVersion
							}`,
						);

						return;
					}

					if (foundEvent.AuthRequired && !this.ConnectedUsers.get(socket.id)?.Authed) {
						// (A) = Auth (not authed)
						user.Close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.CloseOnError);

						this.Debug(`Event ${foundEvent.Name} was not authed from ${user.Id} (${user.Ip})`);

						return;
					}

					if (foundEvent.StrictCheck) {
						const validated = Utils.ValidateAuthCode(foundEvent.AllowedAuthTypes, user.AuthType);

						if (!validated) {
							// (A) = Auth (not authed)
							user.Close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.CloseOnError);

							this.Debug(`Event ${foundEvent.Name} was not authed from ${user.Id} (${user.Ip})`);

							return;
						}
					}

					foundEvent.Execute(user, json.d, this.ConnectedUsers);
				} catch (error: any) {
					this.Debug(`Error while parsing JSON from ${ip}: ${error?.message}`);

					this.emit('error', error, user);

					try {
						// (J) = JSON (invalid)
						user.Close(HardCloseCodes.DecodeError, 'Invalid request (J)', this.CloseOnError);

						this.Debug(`JSON was invalid from ${user.Id} (${user.Ip})`);
					} catch {
						this.Debug(`User ${ip} has already been closed`);
					}
				}
			});
		});

		wss.on('listening', () => {
			// console.log(
			// 	`[Websocket] Websocket is ${this.server ? 'listening on server' : `now listening on port ${this.port}`}`,
			// );

			this.emit('listening', this.Port ?? 0);

			this.StartHeartbeatCheck();
			this.ClearUsers();
			this.ClearConnectedUsers();
		});

		return wss;
	}

	public HandleClose(ws: WebSocket.WebSocket) {
		this.Debug(`Connection from ${ws.id} has been closed`);

		if (!ws.CLOSED && !ws.CLOSING) ws.close();
	}

	public StartHeartbeatCheck() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (!user.Authed) continue;
				if (!user.HeartbeatInterval || !user.LastHeartbeat) continue;

				if (user.LastHeartbeat + user.HeartbeatInterval + 10_000 < Date.now()) {
					if (process.env.debug) {
						this.Debug(
							`User ${id} has not sent a heartbeat in ${
								user.HeartbeatInterval + 10_000
							}ms, closing connection (We got ${this.ConnectedUsers.size} users left)`,
						);
					}

					user.Close(SoftCloseCodes.MissedHeartbeat, 'Missed Heartbeat', false);
				} else if (process.env.debug) {
					this.Debug(
						`User ${id} sent a heartbeat at ${new Date(user.LastHeartbeat).toLocaleString()}, which is ${
							Date.now() - user.LastHeartbeat
						}ms ago`,
					);
				}
			}
		}, this.HeartbeatInterval);
	}

	public ClearUsers() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (!user.Closed) continue;

				// if they closed more then 8 seconds ago, remove them
				if ((user.ClosedAt as number) + 8_000 < Date.now()) {
					this.ConnectedUsers.delete(id);
					this.Debug(`User ${id} has been removed for being closed (We got ${this.ConnectedUsers.size} users left)`);
				} else {
					this.Debug(`User ${id} has been closed for ${Date.now() - (user.ClosedAt as number)}ms`);
				}
			}
		}, this.ClosedInterval);
	}

	public ClearConnectedUsers() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (user.Authed) continue;

				// if its been more then 45 seconds since they connected, remove them
				if ((user.ConnectedAt as number) + 45_000 < Date.now()) {
					this.ConnectedUsers.delete(id);
					user.Close(HardCloseCodes.NotAuthenticated, 'Not Authenticated', false);

					this.Debug(
						`User ${id} has been removed for being connected and not authed (We got ${this.ConnectedUsers.size} users left)`,
					);
				} else {
					this.Debug(`User ${id} has been connected for ${Date.now() - (user.ConnectedAt as number)}ms`);
				}
			}
		}, this.UnauthedTimeout);
	}

	public MassSend(data: any) {
		// unsafe to use tbh
		for (const [, user] of this.ConnectedUsers) {
			user.Send(data);
		}
	}

	public MasDisconnect(reason: string, code?: number) {
		// also unsafe to use (though used for when the server is shutting down)
		for (const [, user] of this.ConnectedUsers) {
			user.Close(code ? code : HardCloseCodes.ServerShutdown, reason, false);
		}
	}

	public ConnectionsByIP(ip: string) {
		let connections = 0;

		for (const [, user] of this.ConnectedUsers) {
			if (user.Ip === ip) connections++;
		}

		return connections;
	}

	private Debug(...args: string[]) {
		// @ts-expect-error - this is a private method, so we can ignore this
		this.emit('debug', ...args);
		if (this.DebugEnabled) console.log(...args);
	}
}

export default WebsocketServer;
