import type { Rest } from '../../Rest';
import type Websocket from '../../Websocket/Ws';

export interface ClientOptions {
	Rest?: Rest;
	Websocket?: Websocket;
	apiUrl: string;
	token: string;
	version: string;
	wsUrl: string;
}
