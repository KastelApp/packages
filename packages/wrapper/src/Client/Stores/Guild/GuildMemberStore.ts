import type Client from '../../Client';
import type GuildMember from '../../Structures/Guilds/GuildMember';
import BaseStore from '../BaseStore.js';

/**
 * A store for GuildMembers.
 */
class GuildMemberStore {
	private readonly client: Client;

	public members: BaseStore<string, GuildMember> = new BaseStore();

	public constructor(client: Client) {
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

	public clear(): void {
		this.members.clear();
	}
}

export { GuildMemberStore };

export default GuildMemberStore;
