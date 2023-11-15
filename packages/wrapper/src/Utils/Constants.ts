/* eslint-disable unicorn/prefer-math-trunc */
/* eslint-disable sonarjs/no-identical-expressions */

import type { AuthlessRoute, WebsocketSettings } from "../types/Misc/ConfigTypes";

export const DefaultWebsocketSettings: WebsocketSettings = {
	Version: "1",
	Url: "wss://gateway.kastelapp.com",
	Encoding: "json",
	Compress: true,
};

export const GuildFeatures = ["Partnered", "Verified", "Official"] as const;

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
	Deleted: 1 << 3, // NOTE: this is only used when the message has the reported flag
	Reported: 1 << 4, // Note: this is private to the users (they won't receive the flag)
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

export const PermissionOverrideTypes = {
	Role: 1 << 0,
	Member: 1 << 1,
	Everyone: 1 << 2,
};

export const ServerOpCodes = {
	Hello: 0, // This is the first thing you get when you connect (just so you know we know you exist)
	Auth: 1, // You send this to Identify yourself
	Authed: 2, // This gets sent to you when you are authenticated
	HeartBeat: 3, // This is a heartbeat to keep the connection alive (you send this)
	HeartBeatAck: 4, // This is a heartbeat to keep the connection alive (you get this)
	MessageCreate: 5, // This is a message being sent to a channel
	MessageDelete: 6, // This is a message being deleted from a channel
	MessageUpdate: 7, // This is a message being updated from a channel
	PurgeMessages: 8, // This is a message being purged from a channel
	ChannelDelete: 9, // This is a channel being deleted
	ChannelNew: 10, // This is a channel being created
	ChannelUpdate: 11, // This is a channel being updated
	GuildDelete: 12, // This is a guild being deleted
	GuildNew: 13, // This is a guild being created
	GuildUpdate: 14, // This is a guild being updated
	GuildRemove: 15, // This is a user being removed from a guild
	InviteDelete: 16, // This is an invite being deleted
	InviteNew: 17, // This is an invite being created
	PurgeInvites: 18, // This is an invite being purged
	RoleDelete: 19, // This is a role being deleted
	RoleNew: 20, // This is a role being created
	RoleUpdate: 21, // This is a role being updated
	MemberAdd: 22, // This is a member being added to a guild
	MemberLeave: 23, // This is a member being removed from a guild
	MemberBan: 24, // This is a member being banned from a guild
	MemberUpdate: 25, // This is a member being updated
	Resume: 26, // This is a resume request
	LazyRequestMembers: 27, // This is a request for members
	LazyRequestGuild: 28, // This is a request for a guild
	NewSession: 29,
	DeleteSession: 30,
	SelfUpdate: 31,
	RelationshipUpdate: 32,
	Error: 33,
};

export const HardCloseCodes = {
	UnknownError: 4_000, // Unknown error
	UnknownOpcode: 4_001, // Unknown opcode
	DecodeError: 4_002, // Failed to decode payload
	NotAuthenticated: 4_003, // Not authenticated (no IDENTIFY payload sent)
	AuthenticationFailed: 4_004, // Authentication failed (wrong password or just an error)
	AlreadyAuthenticated: 4_005, // Already authenticated (why are you sending another IDENTIFY payload?)
	InvalidSeq: 4_007, // Invalid sequence sent when resuming (seq is 5 but the resume payload provided a seq of 4)
	RateLimited: 4_008, // User spammed the gateway (not used yet)
	SessionTimedOut: 4_009, // session timed out
	InvalidRequest: 4_010, // Invalid request (E/O)
	ServerShutdown: 4_011, // Server is shutting down
};

export const SoftCloseCodes = {
	UnknownError: 1_000, // Unknown error
	MissedHeartbeat: 1_001, // Missed heartbeat
};

export const PasswordRequiredFields = ["email", "phoneNumber", "newPassword", "aFlags", "rFlags"] as const;

export const AuthlessRoutes: AuthlessRoute[] = [
	{
		path: /^\/$/,
		type: "NoAuth",
	},
	{
		path: /^\/login$/,
		redirect: "/app",
		type: "RedirectOnAuth",
	},
	{
		path: /^\/register$/,
		redirect: "/app",
		type: "RedirectOnAuth",
	},
	{
		path: /^\/logout$/,
		type: "Auth",
	},
	{
		path: /^\/verify$/,
		type: "NoAuth",
	},
	{
		path: /^\/404$/,
		type: "NoAuth",
	},
	{
		path: /^\/branding$/,
		type: "NoAuth",
	},
	{
		path: /^\/app\/?.*/,
		redirect: "/login",
		type: "Auth",
	},
];

export enum MessageStates {
	Sent = 1,
	Deleted = 2, // will be removed from cache shortly
	Edited = 3,
	Failed = 4, // when a message fails to send
}

// How we handle caching, types: low, medium, high, very high, unlimited (unlimited will keep everything cached)
export const DataCachingConfigurations = [
	{
		type: "low",
		per: {
			guildMembers: 200,
			messages: 50, // PER channel (so if you have 10 channels, it will cache 500 messages)
			bans: 50,
		},
		users: 1_000, // can have a max of 1000 users cached
		invites: 100, // can have a max of 100 invites cached
	},
	{
		// no comments on this besides messages one
		type: "medium",
		per: {
			guildMembers: 1_000,
			messages: 150, // PER channel (so if you have 10 channels, it will cache 1500 messages)
			bans: 100,
		},
		users: 2_000,
		invites: 300,
	},
	{
		type: "high",
		per: {
			guildMembers: 5_000,
			messages: 250, // PER channel (so if you have 10 channels, it will cache 2500 messages)
			bans: 500,
		},
		users: 5_000,
		invites: 300,
	},
	{
		type: "very high",
		per: {
			guildMembers: 10_000,
			messages: 250, // PER channel (so if you have 10 channels, it will cache 2500 messages)
			bans: 500,
		},
		users: 10_000,
		invites: 300,
	},
	{
		type: "unlimited", // SHOULD NEVER USE THIS, THIS IS FOR TESTING ONLY
		per: {
			guildMembers: Number.MAX_SAFE_INTEGER,
			messages: Number.MAX_SAFE_INTEGER, // PER channel (so if you have 10 channels, it will cache Infinity messages)
			bans: Number.MAX_SAFE_INTEGER,
		},
		users: Number.MAX_SAFE_INTEGER,
		invites: Number.MAX_SAFE_INTEGER,
	},
];
