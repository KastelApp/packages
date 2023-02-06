/* eslint-disable no-unused-vars */

import http from 'http';
import WebSocket from 'ws';
import Events from './EventsHandler';
import Errors from './Errors';
import Utils from './Utils';
import User from './User';

import { EventEmitter } from 'events';

export interface WebsocketServer {
  // There are 4 listeners, one is 'connection' which emits when someone connects to the websocket
  // The 2nd one is debug, which emits when the debug function is called
  // The 3rd one is 'error', which emits when an error occurs
  // The 4th one is 'close', which emits when a connection is closed

  on(event: 'connection', listener: (user: User) => void): this;
  on(event: 'debug', listener: (message: string) => void): this;
  on(event: 'error', listener: (error: Error, user?: User) => void): this;
  on(event: 'close', listener: (user: User, expecting: boolean) => void): this;
}

export class WebsocketServer extends EventEmitter {
  connectedUsers: Map<string, User>;

  ws: WebSocket.Server | null;

  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;

  port: number | null;

  allowedIps: string[];

  closeOnError: boolean;

  debugEnabled: boolean;

  maxPerIp: number;

  maxConnectionsPerMinute: number;

  heartbeatInterval: number;

  closedInterval: number;

  unauthedTimeout: number;

  constructor(init: number | http.Server, allowedIps: string[], closeOnError: boolean, debug?: boolean) {
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

    this.debugEnabled = debug || false;

    this.maxPerIp = 10; // only 5 connections per ip (This is a BAD solution, but it works for now)

    this.maxConnectionsPerMinute = 5; // the max connections per minute per ip (meaning 5 people can connect in 1 minute, but 6th will be disconnected)

    this.heartbeatInterval = 1000 * 1; // 1 second

    this.closedInterval = 1000 * 5; // 5 seconds

    this.unauthedTimeout = 1000 * 10; // 10 seconds
  }

  createWs(): WebSocket.Server {
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

      const ipConnections = Array.from(this.connectedUsers.values()).filter((u) => u.ip === ip);

      if (ipConnections.length >= this.maxPerIp) {
        // (M) = IP (max connections reached)
        socket.send(new Errors('Invalid request (M)').toString());

        socket.close(Utils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED);

        this.debug(`Max connections reached for ${ip}`);

        return;
      }

      const lastMinuteConnections = ipConnections.filter((u) => u.connectedAt >= Date.now() - 60000);

      if (lastMinuteConnections.length >= this.maxConnectionsPerMinute) {
        // (MX) = IP (max connections reached)
        socket.send(new Errors('Invalid request (MX)').toString());

        socket.close(Utils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED);

        this.debug(`Max connections reached for ${ip} in the last minute`);

        return;
      }

      this.debug(`New connection from ${ip}`);

      if (this.allowedIps.length > 0 && !this.allowedIps.includes(ip as string)) {
        // (P) = IP (not allowed)
        socket.send(new Errors('Invalid request (P)').toString());

        socket.close(Utils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED);

        this.debug(`Connection from ${ip} was not allowed`);

        return;
      }

      const clientOrBot = req.url?.match(Utils.REGEXES.TYPE);
      const params = req.url?.match(Utils.REGEXES.PARAMS);

      if (!clientOrBot || !params) {
        // (T) = Type (not found)
        socket.send(new Errors('Invalid request (T)').toString());

        socket.close(Utils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED);

        this.debug(`Was not client or bot from ${ip}`);

        return;
      }

      socket.id = Utils.generateSessionID();

      const user = new User(socket.id, socket, false, ip);

      user.setAuth(
        clientOrBot[0] === '/bot'
          ? Utils.AUTH_CODES.BOT
          : clientOrBot[0] === '/system'
          ? Utils.AUTH_CODES.SYSTEM
          : Utils.AUTH_CODES.USER,
      );

      user.setParams(Utils.paramsToObject(params.map((p) => p.replace(/^[?&]/, ''))));

      const usersParams = user.params as {
        encoding?: string; // encoding (should always be json for now)
        v?: string; // version
      };

      if (!usersParams.encoding || usersParams.encoding !== 'json') {
        // (EN) = Encoding (not json)

        user.close(Utils.HARD_CLOSE_CODES.INVALID_REQUEST, 'Invalid request (EN)', this.closeOnError);

        this.debug(`Encoding was not json from ${ip}`);

        return;
      }

      if (!usersParams.v) {
        // (V) = Version (not found)

        user.close(Utils.HARD_CLOSE_CODES.INVALID_REQUEST, 'Invalid request (V)', this.closeOnError);

        this.debug(`Version was not found from ${ip}`);

        return;
      }

      user.setEncoding(usersParams.encoding);
      user.setVersion(usersParams.v);

      this.connectedUsers.set(user.id, user);

      this.emit('connection', user);

      socket.on('close', (code) => {
        if (user.closed || user.closedAt) {
          this.emit('close', user, true);
          return; // We were expecting this
        }

        user.close(code, 'Connection closed', false, true);

        this.emit('close', user, false);
      });

      socket.on('message', (data) => {
        try {
          const json: {
            event?: string;
            op?: number;
            d?: any;
          } = JSON.parse(data.toString());

          if (!json.event && !json.op) {
            // (E/O) = Event or OP
            user.close(Utils.HARD_CLOSE_CODES.INVALID_REQUEST, 'Invalid request (E/O)', this.closeOnError);

            this.debug(`Event or OP was not found from ${user.id} (${user.ip})`);

            return;
          }

          const foundEvent =
            Events.getEventName(json.event as string, user.socketVersion as number) ||
            Events.getEventCode(json.op as number, user.socketVersion as number);

          if (!foundEvent) {
            // (E) = Event (not found)
            user.close(Utils.HARD_CLOSE_CODES.UNKNOWN_OPCODE, 'Invalid request (E)', this.closeOnError);

            this.debug(
              `Event was not found from ${user.id} with the name ${json.event || json.op} (${user.ip}) version: ${
                user.socketVersion
              }`,
            );

            return;
          }

          if (foundEvent.authRequired && !this.connectedUsers.get(socket.id)?.authed) {
            // (A) = Auth (not authed)
            user.close(Utils.HARD_CLOSE_CODES.NOT_AUTHENTICATED, 'Invalid request (A)', this.closeOnError);

            this.debug(`Event ${foundEvent.name} was not authed from ${user.id} (${user.ip})`);

            return;
          }

          if (foundEvent.strictCheck) {
            const validated = Utils.validateAuthCode(foundEvent.allowedAuthTypes, user.authType);

            if (!validated) {
              // (A) = Auth (not authed)
              user.close(Utils.HARD_CLOSE_CODES.NOT_AUTHENTICATED, 'Invalid request (A)', this.closeOnError);

              this.debug(`Event ${foundEvent.name} was not authed from ${user.id} (${user.ip})`);

              return;
            }
          }

          foundEvent.execute(user, json.d, this.connectedUsers);
        } catch (e: any) {
          this.debug(`Error while parsing JSON from ${ip}: ${e?.message}`);

          this.emit('error', e, user);

          try {
            // (J) = JSON (invalid)
            user.close(Utils.HARD_CLOSE_CODES.DECODE_ERROR, 'Invalid request (J)', this.closeOnError);

            this.debug(`JSON was invalid from ${user.id} (${user.ip})`);
          } catch (er: any) {
            console.error(`User ${ip} has already been closed`);
          }
        }
      });
    });

    wss.on('listening', () => {
      console.log(`Websocket is ${this.server ? 'listening on server' : `now listening on port ${this.port}`}`);

      this.startHeartbeatCheck();
      this.clearUsers();
      this.clearConnectedUsers();

      process.on('SIGINT', () => {
        this.debug('Closing Websocket Sending mass discconect');

        this.masDisconnect('Server is shutting down');

        process.exit(0);
      });

      process.on('SIGKILL', () => {
        this.debug('Closing Websocket Sending mass discconect');

        this.masDisconnect('Server is shutting down');

        process.exit(0);
      });
    });

    return wss;
  }

  handleClose(ws: WebSocket.WebSocket) {
    this.debug(`Connection from ${ws.id} has been closed`);

    if (!ws.CLOSED && !ws.CLOSING) ws.close();
  }

  startHeartbeatCheck() {
    setInterval(() => {
      for (const [id, user] of this.connectedUsers) {
        if (!user.authed) continue;
        if (!user.heartbeatInterval || !user.lastHeartbeat) continue;

        if (user.lastHeartbeat + user.heartbeatInterval + 10000 < Date.now()) {
          if (process.env.debug) {
            this.debug(
              `User ${id} has not sent a heartbeat in ${user.heartbeatInterval + 10000}ms, closing connection (We got ${
                this.connectedUsers.size
              } users left)`,
            );
          }

          user.close(Utils.SOFT_CLOSE_CODES.MISSED_HEARTBEAT, 'Missed Heartbeat', false);
        } else if (process.env.debug) {
          this.debug(
            `User ${id} sent a heartbeat at ${new Date(user.lastHeartbeat).toLocaleString()}, which is ${
              Date.now() - user.lastHeartbeat
            }ms ago`,
          );
        }
      }
    }, this.heartbeatInterval);
  }

  clearUsers() {
    setInterval(() => {
      for (const [id, user] of this.connectedUsers) {
        if (!user.closed) continue;

        // if they closed more then 65 seconds ago, remove them
        if ((user.closedAt as number) + 5000 < Date.now()) {
          this.connectedUsers.delete(id);
          this.debug(`User ${id} has been removed for being closed (We got ${this.connectedUsers.size} users left)`);
        } else {
          this.debug(`User ${id} has been closed for ${Date.now() - (user.closedAt as number)}ms`);
        }
      }
    }, this.closedInterval);
  }

  clearConnectedUsers() {
    setInterval(() => {
      for (const [id, user] of this.connectedUsers) {
        if (user.authed) continue;

        // if its been more then 45 seconds since they connected, remove them
        if ((user.connectedAt as number) + 45000 < Date.now()) {
          this.connectedUsers.delete(id);
          user.close(Utils.HARD_CLOSE_CODES.NOT_AUTHENTICATED, 'Not Authenticated', false);

          this.debug(
            `User ${id} has been removed for being connected and not authed (We got ${this.connectedUsers.size} users left)`,
          );
        } else {
          this.debug(`User ${id} has been connected for ${Date.now() - (user.connectedAt as number)}ms`);
        }
      }
    }, this.unauthedTimeout);
  }

  massSend(data: any) {
    for (const [, user] of this.connectedUsers) {
      user.send(data);
    }
  }

  masDisconnect(reason: string, code?: number) {
    for (const [, user] of this.connectedUsers) {
      user.close(code ? code : Utils.HARD_CLOSE_CODES.SERVER_SHUTDOWN, reason, false);
    }
  }

  connectionsByIP(ip: string) {
    let connections = 0;

    for (const [, user] of this.connectedUsers) {
      if (user.ip === ip) connections++;
    }

    return connections;
  }

  debug(...args: string[]) {
    this.emit('debug', ...args);
    if (this.debugEnabled) console.log(...args);
  }
}

export default WebsocketServer;
