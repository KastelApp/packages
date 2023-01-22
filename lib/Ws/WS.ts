/* eslint-disable no-unused-vars */

import http from 'http';
import WebSocket from 'ws';
import Events from './EventsHandler';
import Errors from './Errors';
import Utils from './Utils';
import User from './User';

class WebsocketServer {
  connectedUsers: Map<string, User>;

  ws: WebSocket.Server | null;

  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;

  port: number | null;

  allowedIps: string[];

  closeOnError: boolean;

  constructor(init: number | http.Server, allowedIps: string[], closeOnError: boolean) {
    this.connectedUsers = new Map();

    this.ws = null;

    this.server = typeof init === 'number' ? null : init;

    this.port = typeof init === 'number' ? init : null;

    if (!this.port && !this.server) {
      throw new Error('Invalid port or server');
    }

    this.allowedIps = allowedIps;

    this.closeOnError = closeOnError;
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

      this.debug(`New connection from ${ip}`);

      if (this.allowedIps.length > 0 && !this.allowedIps.includes(ip as string)) {
        // (P) = IP (not allowed)
        socket.send(new Errors('Invalid request (P)').toString());

        socket.close(Utils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED);

        return;
      }

      const id = Utils.generateSessionID();

      socket.id = id;

      const user = new User(id, socket, false);

      this.connectedUsers.set(id, user);

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

            return;
          }

          const foundEvent = Events.getEventName(json.event as string) || Events.getEventCode(json.op as number);

          if (!foundEvent) {
            // (E) = Event (not found)
            user.close(Utils.HARD_CLOSE_CODES.UNKNOWN_OPCODE, 'Invalid request (E)', this.closeOnError);

            return;
          }

          if (foundEvent.authRequired && !this.connectedUsers.get(socket.id)?.authed) {
            // (A) = Auth (not authed)
            user.close(Utils.HARD_CLOSE_CODES.NOT_AUTHENTICATED, 'Invalid request (A)', this.closeOnError);

            return;
          }

          foundEvent.execute(user, json.d, this.connectedUsers);
        } catch (e: any) {
          console.error(`Error while parsing JSON from ${ip}: ${e?.message}`);

          try {
            // (J) = JSON (invalid)
            user.close(Utils.HARD_CLOSE_CODES.DECODE_ERROR, 'Invalid request (J)', this.closeOnError);
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
              `User ${id} has not sent a heartbeat in ${user.heartbeatInterval + 10000}ms, closing connection`,
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
    }, 1000);
  }

  clearUsers() {
    setInterval(() => {
      for (const [id, user] of this.connectedUsers) {
        if (!user.closed) continue;

        // if they closed more then 65 seconds ago, remove them
        if ((user.closedAt as number) + 65000 < Date.now()) {
          this.connectedUsers.delete(id);
          this.debug(`User ${id} has been removed`);
        } else {
          this.debug(`User ${id} has been closed for ${Date.now() - (user.closedAt as number)}ms`);
        }
      }
    }, 5000);
  }

  clearConnectedUsers() {
    setInterval(() => {
      for (const [id, user] of this.connectedUsers) {
        if (user.authed) continue;

        // if its been more then 45 seconds since they connected, remove them
        if ((user.connectedAt as number) + 45000 < Date.now()) {
          this.connectedUsers.delete(id);
          this.debug(`User ${id} has been removed`);
        } else {
          this.debug(`User ${id} has been connected for ${Date.now() - (user.connectedAt as number)}ms`);
        }
      }
    }, 5000);
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

  debug(...args: any[]) {
    if (process.env.debug) console.log(...args);
  }
}

export default WebsocketServer;
