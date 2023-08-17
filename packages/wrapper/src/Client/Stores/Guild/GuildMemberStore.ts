import type Client from '../../Client';
import type GuildMember from '../../Structures/Guilds/GuildMember';
import BaseStore from '../BaseStore.js';

/**
 * A store for guild members
 */
class GuildMemberStore {
	public members: BaseStore<string, GuildMember>;

	private readonly client: Client;

	public constructor(client: Client) {
		this.members = new BaseStore<string, GuildMember>();

		this.client = client;

		if (this.client) {
			//
		}
	}

	public get(id: string): GuildMember | undefined {
		return this.members.get(id);
	}

	public set(id: string, value: GuildMember): this {
		this.members.set(id, value);

		return this;
	}

	public toArray(): GuildMember[] {
		return this.members.array();
	}
}

export { GuildMemberStore };

export default GuildMemberStore;
