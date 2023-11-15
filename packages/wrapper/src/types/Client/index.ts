import type { Rest } from "../../Rest/Rest";
import type Websocket from "../../Websocket/Ws";

export interface ClientOptionsUnauthed {
	Rest?: Rest;
	Websocket?: Websocket;
	apiUrl: string;
	token: null;
	unAuthed: true;
	version: string;
	worker?: Worker;
	wsUrl: string;
}

export interface ClientOptionsAuthed {
	Rest?: Rest;
	Websocket?: Websocket;
	apiUrl: string;
	token: string;
	unAuthed: false;
	version: string;
	worker?: Worker;
	wsUrl: string;
}

export type ClientOptions = ClientOptionsAuthed | ClientOptionsUnauthed;

export interface RegisterAndLoginSuccess {
	success: true;
	token: string;
	userData?: {
		avatar: string | null;
		email: string;
		id: string;
		publicFlags: number;
		tag: string;
		username: string;
	};
}

export interface RegisterAndLoginError {
	errors: {
		email: boolean;
		maxUsernames?: boolean;
		password: boolean;
		unknown?: {
			[k: string]: {
				Code: string;
				Message: string;
			};
		};
		username?: boolean;
	};
	success: false;
}

export type RegisterAndLogin = RegisterAndLoginError | RegisterAndLoginSuccess;
