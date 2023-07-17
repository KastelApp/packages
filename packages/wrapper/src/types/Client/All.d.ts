interface InternalUser {
	AccountDeletionInProgress: boolean;
	Avatar: string;
	Banned: boolean;
	BannedReason: string;
	Email: string;
	EmailVerified: boolean;
	Flags: number;
	GlobalNickname: string;
	Id: string;
	Locked: boolean;
	Password: string;
	Tag: string;
	TwoFa: boolean;
	TwoFaVerified: boolean;
	Username: string;
}

type UserAtMe = Omit<InternalUser, 'AccountDeletionInProgress' | 'Banned' | 'BannedReason' | 'Locked' | 'Password'>;

type PublicUser = Omit<
	InternalUser,
	| 'AccountDeletionInProgress'
	| 'Banned'
	| 'BannedReason'
	| 'EmailVerified'
	| 'Locked'
	| 'Password'
	| 'TwoFa'
	| 'TwoFaVerified'
>;

interface Tokens {
	CreatedDate: number;
	Flags: number;
	Ip: string;
	Token: string;
}

interface Settings {
	Language: string;
	Mentions: Mentions;
	Presence: number;
	Privacy: number;
	Status: string;
	Theme: string;
	Tokens: Tokens;
	User: InternalUser;
}

interface Friend {
	Flags: number;
	Receiver: InternalUser;
	ReceiverNickname: string;
	Sender: InternalUser;
	SenderNickname: string;
}

interface GuildMember {
	Flags: number;
	Id: string;
	JoinedAt: number;
	Nickname: string;
	Owner: boolean;
	Roles: Role[];
	User: InternalUser;
}

interface Role {
	AllowedMentions: number;
	AllowedNsfw: boolean;
	Color: number;
	Deleteable: boolean;
	Hoisted: boolean;
	Id: string;
	Name: string;
	Permissions: number;
}

interface Message {
	AllowedMentions: number;
	Author: GuildMember;
	Content: string;
	CreatedAt: number;
	Flags: number;
	Id: string;
	Nonce: string;
	UpdatedAt: number;
}

interface Mentions {
	Message: Message;
}

interface Channel {
	AllowedMentions: number;
	Children: string[];
	Description: string;
	Id: string;
	Name: string;
	Nsfw: boolean;
	Parent: string;
	Permissions: number;
	Position: number;
	Type: number;
}

interface Invite {
	Creator: GuildMember;
	Deleteable: boolean;
	Expires: null;
	Id: string;
	MaxUses: number;
	Uses: number;
}

interface Ban {
	BanDate: number;
	Banner: GuildMember;
	Reason: string;
	UnbanDate: number;
	User: GuildMember;
	id: string;
}

interface Emoji {
	Creator: GuildMember;
	Disabled: boolean;
	EmojiHash: string;
	Id: string;
	Name: string;
	Public: boolean;
}

interface Guild {
	Bans: Ban[];
	Channels: Channel[];
	CoOwners: GuildMember[];
	Description: string;
	Emojis: Emoji[];
	Flags: number;
	Icon: string;
	Id: string;
	Invites: Invite[];
	MaxMembers: number;
	Members: GuildMember[];
	Name: string;
	Owner: GuildMember | null;
	Roles: Role[];
}

export type {
	UserAtMe,
	PublicUser,
	Settings,
	Friend,
	GuildMember,
	Role,
	Message,
	Mentions,
	Channel,
	Invite,
	Ban,
	Emoji,
	Guild,
	InternalUser,
	Tokens,
};
