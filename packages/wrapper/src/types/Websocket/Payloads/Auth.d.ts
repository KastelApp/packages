export interface Auth {
	Guilds: Guild[];
	HeartbeatInterval: number;
	Mentions: any[];
	SessionId: string;
	Settings: Settings;
	User: User;
}

export interface User {
	AvatarHash: string | null;
	Email: string;
	EmailVerified: boolean;
	Id: string;
	PhoneNumber: string | null;
	PublicFlags: number;
	Tag: string;
	TwoFa: boolean;
	TwoFaVerified: boolean;
	Username: string;
}

export interface Guild {
	Bans: any[];
	Channels: Channel[];
	CoOwners: any[];
	Description: string;
	Flags: number;
	Id: string;
	Invites: any[];
	MaxMembers: number;
	Members: any[];
	Name: string;
	Owner: Owner;
	Roles: Role[];
}

export interface Owner {
	Id: string;
	JoinedAt: number;
	Roles: string[];
	User: User2;
}

export interface User2 {
	AvatarHash: string | null;
	Id: string;
	PublicFlags: number;
	Tag: string;
	Username: string;
}

export interface Channel {
	AllowedMentions: number;
	Children: string[];
	Description?: string;
	Id: string;
	Name: string;
	Parent?: string;
	Position: number;
	Type: number;
}

export interface Role {
	AllowedMentions: number;
	Deleteable: boolean;
	Hoisted: boolean;
	Id: string;
	Name: string;
	Permissions: string;
}

export interface Settings {
	Language: string;
	Privacy: number;
	Theme: string;
}
