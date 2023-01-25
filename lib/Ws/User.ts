import WebSocket from 'ws';
import Errors from './Errors';
import Utils from './Utils';
import zlib from 'zlib';

interface EventQueue {
  seq: boolean;
  e: {
    op: number;
    event?: string;
    d: any;
  };
}

export default class User {
  id: string;
  ws!: WebSocket.WebSocket;
  authed: boolean;
  seq: number;
  connectedAt: number;
  lastHeartbeat: number | null;
  heartbeatInterval: number | null;
  closed: boolean;
  closedAt: number | null;
  closedCode: number;
  eventQueue: EventQueue[];
  encoding: 'json'; // encoding is always json (This is here for future use)
  compression: boolean; // compression is possible when encoding is json (because its zlib idk)
  authType: number | null;
  params: {
    [key: string]: string;
  };
  socketVersion: number | null;
  constructor(id: string, ws: WebSocket.WebSocket, authed: boolean) {
    this.id = id;

    Object.defineProperty(this, 'ws', {
      value: ws,
      writable: true,
      enumerable: false,
      configurable: false,
    });

    this.authed = authed;

    this.authType = null;

    this.seq = 0;

    this.encoding = 'json';

    this.compression = false;

    this.socketVersion = null;

    this.connectedAt = Date.now();

    this.lastHeartbeat = null;

    this.heartbeatInterval = null;

    this.closed = false;

    this.closedAt = null;

    this.closedCode = -1;

    this.eventQueue = [];

    this.params = {};
  }

  compress(data: any): Buffer | string {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    if (typeof data !== 'string') {
      throw new Error('Invalid data (not a string even after conversion)');
    }

    if (!this.compression) {
      return data; // just to make my life easier
    }

    const input = Buffer.from(data);

    const compressed = zlib.deflateSync(input);

    return compressed;
  }

  send(data: any, seq = true) {
    // if seq is true, it will add a sequence number to the data else it will not
    if (this.closed) {
      if (!(Date.now() - (this.closedAt as number) > 60000)) {
        this.eventQueue.push({
          seq,
          e: data,
        });
      }

      return;
    }

    if (seq) {
      this.seq++;
    }

    data = this.compress({
      ...data,
      ...(seq ? { s: this.seq } : {}),
    });

    this.ws.send(data);
  }

  close(code: number, reason: string, force: boolean) {
    try {
      if (this.closed) {
        return; // Its already closed, why are you trying to close it again?
      }

      if (force) {
        this.ws.close(code, reason);
      } else {
        this.ws.send(new Errors(reason).toString());

        this.ws.close(code, reason);
      }

      this.closed = true;
      this.closedAt = Date.now();
      this.closedCode = code;
    } catch (e) {
      console.error(e);

      this.ws.terminate();
    }
  }

  setAuthed(authed: boolean) {
    this.authed = authed;
  }

  setClosed(closed: boolean) {
    this.closed = closed;
  }

  setSessionId(sessionId: string) {
    this.id = sessionId;
  }

  setWs(ws: WebSocket.WebSocket) {
    this.ws = ws;
  }

  setHeartbeatInterval(interval: number) {
    this.heartbeatInterval = interval;
  }

  setLastHeartbeat(lastHeartbeat: number) {
    this.lastHeartbeat = lastHeartbeat;
  }

  setAuth(auth: number) {
    this.authType = auth;
  }

  setEncoding(encoding: 'json') {
    this.encoding = encoding;
  }

  setCompression(compression: boolean) {
    this.compression = compression;
  }

  setParams(params: { [key: string]: string }) {
    this.params = params;
  }

  setVersion(version: string) {
    this.socketVersion = parseInt(version);
  }

  resume(seq: number): boolean {
    if (!this.closed || !this.closedAt) {
      return false; // how can you resume if you never closed?
    }

    if (this.seq !== seq) {
      return false;
    }

    // if this.closedAt has been longer then 60 seconds, return false (session expired)
    if (Date.now() - this.closedAt > 60000) {
      return false;
    }

    if (Object.values(Utils.HARD_CLOSE_CODES).includes(this.closedCode)) {
      return false;
    }

    this.closed = false;
    this.closedAt = null;

    return true;
  }

  nextQueue(): EventQueue | null {
    if (this.eventQueue.length === 0) {
      return null;
    }

    const event = this.eventQueue.shift();

    if (!event) {
      return null;
    }

    this.send(event.e, event.seq);

    return event;
  }

  queue() {
    // loop through the queue and call nextQueue after sending the first event
    const firstEvent = this.eventQueue[0];

    if (!firstEvent) {
      return;
    }

    this.send(firstEvent.e, firstEvent.seq);

    while (this.nextQueue()) {
      // do nothing
    }
  }
}
