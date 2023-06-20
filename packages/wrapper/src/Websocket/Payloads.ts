/* eslint-disable id-length */
import { ClientOpCodes } from '../Utils/Constants.js';
import type Websocket from './Ws';

class Payloads {
	private readonly Gateway: Websocket | undefined;

	private readonly Send: boolean | undefined;

	public constructor(Gateway?: Websocket, Send?: boolean) {
		this.Gateway = Gateway;

		this.Send = Send;

		if (this.Send && !this.Gateway) {
			throw new Error('[Wrapper] [Payloads] You cannot send payloads without a gateway');
		}
	}

	public Identify(): {
		d: {
			Settings: {
				Compress: boolean | undefined;
			};
			Token: string | null | undefined;
		};
		op: number;
	} {
		const Data = {
			op: ClientOpCodes.Auth,
			d: {
				Token: this.Gateway?.Token,
				Settings: {
					Compress: this.Gateway?.Compression,
				},
			},
		};

		if (this.Send && this.Gateway) {
			this.Gateway.send(JSON.stringify(Data));
		}

		return Data;
	}

	public Heartbeat(): {
		d: {
			Sequence: number;
		};
		op: number;
	} {
		const Data = {
			op: ClientOpCodes.Heartbeat,
			d: {
				Sequence: this.Gateway?.Sequence ?? 0,
			},
		};

		if (this.Send && this.Gateway) {
			this.Gateway.send(JSON.stringify(Data));
		}

		return Data;
	}
}

export default Payloads;

export { Payloads };
