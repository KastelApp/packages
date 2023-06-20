/* eslint-disable unicorn/prefer-math-trunc */
/* eslint-disable sonarjs/no-identical-expressions */

import type { WebsocketSettings } from '../types/Misc/ConfigTypes';

export const DefaultWebsocketSettings: WebsocketSettings = {
	Version: '1',
	Url: 'wss://gateway.kastelapp.com',
	Encoding: 'json',
	Compress: true,
};

export const GuildFlags = {
	Verified: 1 << 0,
	Partnered: 1 << 1,
	Official: 1 << 2,
	NoOwner: 1 << 10,
};

export const GuildMemberFlags = {
	Left: 1 << 0,
	In: 1 << 1,
	Kicked: 1 << 2,
	Banned: 1 << 3,
	Owner: 1 << 4,
	CoOwner: 1 << 5,
};

export const ChannelTypes = {
	GuildCategory: 1 << 0,
	GuildText: 1 << 1,
	GuildNews: 1 << 2,
	GuildRules: 1 << 3,
	GuildVoice: 1 << 4,
	GuildNewMember: 1 << 5,
	Dm: 1 << 10,
	GroupChat: 1 << 11,
};

export const Presence = {
	Online: 1 << 0,
	Idle: 1 << 1,
	Dnd: 1 << 2,
	Offline: 1 << 3,
};

export const MessageFlags = {
	System: 1 << 0,
	Normal: 1 << 1,
	Reply: 1 << 2,
};

export const Flags = {
	StaffBadge: 1n << 0n,
	GhostBadge: 1n << 1n,
	SponsorBadge: 1n << 2n,
	DeveloperBadge: 1n << 3n,
	VerifiedBotDeveloperBadge: 1n << 4n,
	OriginalUserBadge: 1n << 5n,
	PartnerBadge: 1n << 6n,
	ModeratorBadge: 1n << 7n,
	MinorBugHunterBadge: 1n << 8n,
	IntermediateBugHunterBadge: 1n << 9n,
	MajorBugHunterBadge: 1n << 10n,
	Ghost: 1n << 25n,
	System: 1n << 26n,
	Staff: 1n << 27n,
	BetaTester: 1n << 28n,
	Bot: 1n << 29n,
	VerifiedBot: 1n << 30n,
	Spammer: 1n << 31n,
	Tos: 1n << 32n,
	GuildBan: 1n << 33n,
	FriendBan: 1n << 34n,
	GroupchatBan: 1n << 35n,
	WaitingOnAccountDeletion: 1n << 36n,
	WaitingOnDisableDataUpdate: 1n << 37n,
};

export const MixedPermissions = {
	ManageMessages: 1n << 9n,
	SendMessages: 1n << 10n,
	ReadMessages: 1n << 11n,
	CreateInvites: 1n << 14n,
	BypassSlowmode: 1n << 16n,
	ManageWebhooks: 1n << 19n,
};

export const RolePermissions = {
	Administrator: 1n << 0n,
	ManageGuild: 1n << 1n,
	ManageRoles: 1n << 2n,
	ManageChannels: 1n << 3n,
	ManageMembers: 1n << 4n,
	ManageEmojis: 1n << 5n,
	ManageBans: 1n << 6n,
	ManageNicknames: 1n << 7n,
	ManageInvites: 1n << 8n,
	KickMembers: 1n << 12n,
	BanMembers: 1n << 13n,
	ChangeNickname: 1n << 18n,
	ViewAuditLog: 1n << 20n,
	AddBots: 1n << 21n,
	ViewChannels: 1n << 22n,
};

export const ChannelPermissions = {
	ViewChannel: 1n << 15n,
	ManageChannel: 1n << 17n,
};

export const Permissions = {
	...MixedPermissions,
	...RolePermissions,
	...ChannelPermissions,
};

export const RelationshipFlags = {
	Blocked: 1,
	FriendRequest: 1 << 1,
	Friend: 1 << 2,
	Denied: 1 << 3,
	MutualFriend: 1 << 4,
};

export const ClientOpCodes = {
	Auth: 1,
	Heartbeat: 3,
	Resume: 26,
	LazyRequestMembers: 27,
	LazyRequestGuild: 28,
};

export const ServerOpCodes = {
	Hello: 0,
	Authed: 2,
	HeartBeat: 3,
	HeartBeatAck: 4,
	MessageCreate: 5,
	MessageDelete: 6,
	MessageUpdate: 7,
	PurgeMessages: 8,
	ChannelDelete: 9,
	ChannelNew: 10,
	ChannelUpdate: 11,
	GuildDelete: 12,
	GuildNew: 13,
	GuildUpdate: 14,
	GuildRemove: 15,
	InviteDelete: 16,
	InviteNew: 17,
	PurgeInvites: 18,
	RoleDelete: 19,
	RoleNew: 20,
	RoleUpdate: 21,
	MemberAdd: 22,
	MemberLeave: 23,
	MemberBan: 24,
	MemberUpdate: 25,
};
