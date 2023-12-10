import type { Member } from '../../../types/Websocket/Payloads/Auth.js';
import type { Client } from '../../Client.js';
import type BaseUser from '../Users/BaseUser.js';
import type Guild from './Guild.js';
import type Role from './Role.js';

class GuildMember {
	private readonly Client: Client;

	public readonly guild: Guild;

	public readonly user: BaseUser;

	public readonly roles: Role[];

	public readonly joinedAt: Date;

	public readonly owner: boolean;

	public readonly nickname: string | null;

	public constructor(client: Client, RawGuildMember: Member, Guild: Guild) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseGuild] You cannot create a guild without a client');
		}

		this.guild = Guild;

		this.user = this.Client.users.get(RawGuildMember.User.Id) as BaseUser;

		if (!this.user) {
			throw new Error('[Wrapper] [BaseGuild] You cannot create a guild member without a user');
		}

		this.roles = this.guild.roles.filter((role) => RawGuildMember.Roles.includes(role.id));

		this.joinedAt = new Date(RawGuildMember.JoinedAt);

		this.owner = RawGuildMember.Owner;

		this.nickname = RawGuildMember.Nickname;
	}
}

export default GuildMember;

export { GuildMember };
