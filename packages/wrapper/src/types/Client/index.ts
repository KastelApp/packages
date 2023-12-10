import type BaseChannel from '../../Client/Structures/Channels/BaseChannel.js';
import type Guild from '../../Client/Structures/Guilds/Guild.js';
import type BaseUser from '../../Client/Structures/Users/BaseUser.js';
import type { Rest } from '../../Rest/Rest';
import type Websocket from '../../Websocket/Ws';

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

export interface CreateInvite {
	expiresAt?: Date;
	maxUses?: number;
}

interface CreateInviteResponseSuccess {
	code: string;

	expiresAt: string;
	maxUses: number;
	success: true;
}

interface CreateInviteResponseFail {
	code: null;
	errors?: {
		invalidChannel?: boolean;
		noPermissions?: boolean;
	};
	expiresAt: null;
	maxUses: null;
	success: false;
}

interface InviteSuccess {
	channel: BaseChannel;
	code: string;
	creator: BaseUser;
	guild: Guild;
	success: true;
}

interface InviteFail {
	channel: null;
	code: null;
	creator: null;
	guild: null;
	success: false;
}

export type InviteResponse = InviteFail | InviteSuccess;

export type CreateInviteResponse = CreateInviteResponseFail | CreateInviteResponseSuccess;

export type RegisterAndLogin = RegisterAndLoginError | RegisterAndLoginSuccess;
