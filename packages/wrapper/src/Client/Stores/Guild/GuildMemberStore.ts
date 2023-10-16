import { type Writable, writable } from 'svelte/store';
import type Client from '../../Client';
import type GuildMember from '../../Structures/Guilds/GuildMember';
import BaseStore from '../BaseStore.js';

/**
 * A store for GuildMembers.
 */
class GuildMemberStore {
	public membersStore: Writable<BaseStore<string, GuildMember>>;

	private readonly client: Client;

	public members: BaseStore<string, GuildMember> = new BaseStore();

	public constructor(client: Client) {
		this.membersStore = writable(new BaseStore<string, GuildMember>());

		this.client = client;

		if (this.client) {
			//
		}

		this.membersStore.subscribe((value) => {
			this.members = value;
		});
	}

	public get(id: string): GuildMember | undefined {
		return this.members.get(id);
	}

	public set(id: string, value: GuildMember): this {
		this.members.set(id, value);
		this.membersStore.set(this.members);

		return this;
	}

	public toArray(): GuildMember[] {
		return this.members.array();
	}

	public clear(): void {
		this.members.clear();
		this.membersStore.set(this.members);
	}
}

export { GuildMemberStore };

export default GuildMemberStore;
