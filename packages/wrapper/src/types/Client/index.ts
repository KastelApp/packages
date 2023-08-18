import type { Rest } from '../../Rest';
import type Websocket from '../../Websocket/Ws';

interface ClientOptionsUnauthed {
	Rest?: Rest;
	Websocket?: Websocket;
	apiUrl: string;
	token: null;
	unAuthed: true;
	version: string;
	worker?: Worker;
	wsUrl: string;
}

interface ClientOptionsAuthed {
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

interface RegisterAndLoginSuccess {
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

interface RegisterAndLoginError {
	errors: {
		email: boolean;
		maxUsernames?: boolean;
		password: boolean;
		username?: boolean;
	};
	success: false;
}

export type RegisterAndLogin = RegisterAndLoginError | RegisterAndLoginSuccess;
