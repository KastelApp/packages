import type { Buffer } from 'node:buffer';
import { deflateSync } from 'node:zlib';
import type WebSocket from 'ws';
import Errors from './Errors.js';
import { HardCloseCodes } from './Utils.js';

interface EventQueue {
	e: {
		d: any;
		event?: string;
		op: number;
	};
	seq: boolean;
}

class User {
	public Id: string;

	public Ws!: WebSocket.WebSocket;

	public Authed: boolean;

	public Seq: number;

	public ConnectedAt: number;

	public LastHeartbeat: number | null;

	public HeartbeatInterval: number | null;

	public Closed: boolean;

	public ClosedAt: number | null;

	public ClosedCode: number;

	public EventQueue: EventQueue[];

	public Encoding: 'json'; // encoding is always json (This is here for future use)

	public Compression: boolean; // compression is possible when encoding is json (because its zlib idk)

	public AuthType: number | null;

	public Params: {
		[key: string]: string;
	};

	public SocketVersion: number | null;

	public Ip: string;

	public constructor(id: string, ws: WebSocket.WebSocket, authed: boolean, ip: string) {
		this.Id = id;

		Object.defineProperty(this, 'Ws', {
			value: ws,
			writable: true,
			enumerable: false,
			configurable: false,
		});

		this.Authed = authed;

		this.Ip = ip;

		this.AuthType = null;

		this.Seq = 0;

		this.Encoding = 'json';

		this.Compression = false;

		this.SocketVersion = null;

		this.ConnectedAt = Date.now();

		this.LastHeartbeat = null;

		this.HeartbeatInterval = null;

		this.Closed = false;

		this.ClosedAt = null;

		this.ClosedCode = -1;

		this.EventQueue = [];

		this.Params = {};
	}

	public compress(data: any): Buffer | string {
		let changedData = data;

		if (typeof data !== 'string') {
			changedData = JSON.stringify(data);
		}

		if (typeof data !== 'string') {
			throw new TypeError('Invalid data (not a string even after conversion)');
		}

		if (!this.Compression) {
			return changedData; // just to make my life easier
		}

		return deflateSync(changedData);
	}

	public send(data: any, seq = true) {
		// if seq is true, it will add a sequence number to the data else it will not
		if (this.Closed) {
			if (Date.now() - (this.ClosedAt as number) <= 60_000) {
				this.EventQueue.push({
					seq,
					// eslint-disable-next-line id-length
					e: data,
				});
			}

			return;
		}

		if (seq) {
			this.Seq++;
		}

		const changedData = this.compress({
			...data,
			// eslint-disable-next-line id-length
			...(seq ? { s: this.Seq } : {}),
		});

		this.Ws.send(changedData);
	}

	public close(code: number, reason: string, force: boolean, soft?: boolean) {
		try {
			if (this.Closed) {
				return; // Its already closed, why are you trying to close it again?
			}

			if (soft) {
				// soft is when the user is closing the connection
				this.Closed = true;
				this.ClosedAt = Date.now();
				this.ClosedCode = code;

				return;
			}

			if (force) {
				this.Ws.close(code, reason);
			} else {
				this.Ws.send(new Errors(reason).toString());

				this.Ws.close(code, reason);
			}

			this.Closed = true;
			this.ClosedAt = Date.now();
			this.ClosedCode = code;
		} catch (error) {
			console.error(error);

			this.Ws.terminate();
		}
	}

	public setAuthed(authed: boolean) {
		this.Authed = authed;
	}

	public setClosed(closed: boolean) {
		this.Closed = closed;
	}

	public setSessionId(sessionId: string) {
		this.Id = sessionId;
	}

	public setWs(ws: WebSocket.WebSocket) {
		this.Ws = ws;
	}

	public setHeartbeatInterval(interval: number) {
		this.HeartbeatInterval = interval;
	}

	public setLastHeartbeat(lastHeartbeat: number) {
		this.LastHeartbeat = lastHeartbeat;
	}

	public setAuth(auth: number) {
		this.AuthType = auth;
	}

	public setEncoding(encoding: 'json') {
		this.Encoding = encoding;
	}

	public setCompression(compression: boolean) {
		this.Compression = compression;
	}

	public setParams(params: { [key: string]: string }) {
		this.Params = params;
	}

	public setVersion(version: string) {
		this.SocketVersion = Number.parseInt(version, 10);
	}

	public resume(seq: number): boolean {
		if (!this.Closed || !this.ClosedAt) {
			return false; // how can you resume if you never closed?
		}

		if (this.Seq !== seq) {
			return false;
		}

		// if this.closedAt has been longer then 60 seconds, return false (session expired)
		if (Date.now() - this.ClosedAt > 60_000) {
			return false;
		}

		if (Object.values(HardCloseCodes).includes(this.ClosedCode)) {
			return false;
		}

		this.Closed = false;
		this.ClosedAt = null;

		return true;
	}

	public nextQueue(): EventQueue | null {
		if (this.EventQueue.length === 0) {
			return null;
		}

		const event = this.EventQueue.shift();

		if (!event) {
			return null;
		}

		this.send(event.e, event.seq);

		return event;
	}

	public queue() {
		// loop through the queue and call nextQueue after sending the first event
		const firstEvent = this.EventQueue[0];

		if (!firstEvent) {
			return;
		}

		this.send(firstEvent.e, firstEvent.seq);

		while (this.nextQueue()) {
			// do nothing
		}
	}
}

export default User;

export { User };
