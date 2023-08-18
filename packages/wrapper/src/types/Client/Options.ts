export interface CreateChannelOptions {
	children?: string[];
	description?: string;
	name: string;
	nsfw?: boolean;
	parentId?: string;
	permissionsOverrides?: {
		[key: string]: {
			allow: string;
			deny: string;
			slowmode: number;
			type: number;
		};
	};
	position?: number;
	slowmode?: number;
	type: number;
}

export interface RegisterAccountOptions {
	email: string;
	inviteCode?: string;
	password: string;
	resetClient?: boolean;
	username: string; // with this as true it will reset the client and automatically add the token etc etc
}

export interface LoginOptions {
	email: string;
	password: string;
	resetClient?: boolean;
}
