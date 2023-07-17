const Endpoints = {
	Login: () => {
		return '/auth/login';
	},
	Register: () => {
		return '/auth/register';
	},
	ForgotPassword: () => {
		return '/auth/forgot';
	},
	Logout: () => {
		return '/auth/logout';
	},
	ResetPassword: () => {
		return '/auth/reset';
	},
	Validate: () => {
		return '/auth/verify/validate';
	},
	VerifyEmail: () => {
		return '/auth/verify';
	},
	Channel: (ChannelId: string) => {
		return `/channels/${ChannelId}`;
	},
	ChannelMessages: (ChannelId: string) => {
		return `/channels/${ChannelId}/messages`;
	},
	PurgeMessages: (ChannelId: string) => {
		return `/channels/${ChannelId}/messages/purge`;
	},
	Message: (ChannelId: string, MessageId: string) => {
		return `/channels/${ChannelId}/messages/${MessageId}`;
	},
	Guilds: () => {
		return '/guilds';
	},
	NewGuild: () => {
		return '/guilds/new';
	},
	Guild: (GuildId?: string) => {
		return `/guilds${GuildId ? `/${GuildId}` : ''}`;
	},
	GuildChannels: (GuildId: string) => {
		return `/guilds/${GuildId}/channels`;
	},
	GuildCowners: (GuildId: string) => {
		return `/guilds/${GuildId}/cowners`;
	},
	GuildCowner: (GuildId: string, CownerId: string) => {
		return `/guilds/${GuildId}/cowners/${CownerId}`;
	},
	GuildInvites: (GuildId: string) => {
		return `/guilds/${GuildId}/invites`;
	},
	GuildInvite: (GuildId: string, InviteCode: string) => {
		return `/guilds/${GuildId}/invites/${InviteCode}`;
	},
	PurgeInvites: (GuildId: string) => {
		return `/guilds/${GuildId}/invites/purge`;
	},
	GuildMembers: (GuildId: string) => {
		return `/guilds/${GuildId}/members`;
	},
	GuildMember: (GuildId: string, MemberId: string) => {
		return `/guilds/${GuildId}/members/${MemberId}`;
	},
	BanMember: (GuildId: string, MemberId: string) => {
		return `/guilds/${GuildId}/members/${MemberId}/ban`;
	},
	KickMember: (GuildId: string, MemberId: string) => {
		return `/guilds/${GuildId}/members/${MemberId}/kick`;
	},
	Invite: (InviteCode: string) => {
		return `/invites/${InviteCode}`;
	},
	JoinInvite: (InviteCode: string) => {
		return `/invites/${InviteCode}/join`;
	},
	DMs: () => {
		return '/users/@me/dms';
	},
	DisableAccount: () => {
		return '/users/@me/disable';
	},
	User: (UserId?: string) => {
		return `/users/${UserId ?? '@me'}`;
	},
	UserFriends: (UserId?: string) => {
		// If a userid is provided we will return mutual friends
		return `/users/${UserId ?? '@me'}/friends`;
	},
	UserSessions: () => {
		return '/users/@me/sessions';
	},
	UserBlock: (UserId: string) => {
		return `/users/${UserId}/block`;
	},
	UserFriend: (UserId: string) => {
		return `/users/${UserId}/friend`;
	},
};

const Routes = {
	Login: () => {
		return '/login';
	},
	Register: () => {
		return '/register';
	},
	ForgotPassword: () => {
		return '/reset-password';
	},
	Logout: () => {
		return '/logout';
	},
};

export { Endpoints, Routes };
