import Rest from '../Rest/Rest.js';
import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import Websocket from '../Websocket/Ws.js';
import type { ClientOptions } from '../types/Client';

class Client {
	private readonly Rest: Rest | null;

	private readonly Websocket: Websocket | null;

	private Token: string | null;

	private readonly Version: string | null;

	private readonly ApiUrl: string | null;

	private readonly WsUrl: string | null;

	public constructor(options: ClientOptions) {
		this.Rest = options.Rest ?? null;

		this.Websocket = options.Websocket ?? null;

		this.Token = options.token ?? null;

		this.Version = options.version ?? null;

		this.ApiUrl = options.apiUrl ?? null;

		this.WsUrl = options.wsUrl ?? null;

		if (this.Websocket?.Status === 'ready') {
			console.warn('[Wrapper] [Client] Websocket is already ready, we will be reconnecting...');
		}

		if (!this.Websocket) {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this)
				.setToken(this.Token)
				.setVersion(this.Version.replace('v', ''))
				.setUrl(this.WsUrl);
		}

		if (!this.Rest) {
			this.Rest = new Rest().setToken(this.Token).setVersion(this.Version).setUrl(this.ApiUrl);
		}
	}

	public setToken(token: string): void {
		this.Token = token;

		if (this.Websocket) this.Websocket.setToken(this.Token);
		if (this.Rest) this.Rest.setToken(this.Token);
	}

	public connect(token?: string): void {
		if (token) this.setToken(token);

		if (this.Websocket) this.Websocket.connect();
	}
}

export default Client;

export { Client };
