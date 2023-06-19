import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import Websocket from '../Websocket/Ws.js';
import type { ClientOptions } from '../types/Client';

export default class Client {
	private readonly Rest: any;

	private readonly Websocket: Websocket | null;

	private Token: string | null;

	public constructor(options: ClientOptions) {
		this.Rest = options.Rest ?? null;

		this.Websocket = options.Websocket ?? null;

		this.Token = null;

		if (this.Websocket?.Status === 'ready') {
			console.warn('[Wrapper] [Client] Websocket is already ready, we will be reconnecting...');
		}

		if (!this.Websocket) {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this);
		}
	}
    
    public setToken(token: string): void {
        this.Token = token;
        
        if (this.Websocket) this.Websocket.setToken(token);
        if (this.Rest) this.Rest.setToken(token);
    }
}
