import type Client from '../../Client';
import type Invite from '../../Structures/Guilds/Invite';
import BaseStore from '../BaseStore.js';

/**
 * A store for Invites.
 */
class InviteStore {
	private readonly client: Client;

	public invites: BaseStore<string, Invite> = new BaseStore();

	public constructor(client: Client) {
		this.client = client;

		if (this.client) {
			//
		}
	}

	public clear(): void {
		this.invites.clear();
	}

	public get(id: string): Invite | undefined {
		return this.invites.get(id);
	}

	public set(id: string, value: Invite): this {
		this.invites.set(id, value);

		return this;
	}

	public toArray(): Invite[] {
		return this.invites.array();
	}

	public filter(fn: (value: Invite, index: number, array: Invite[]) => unknown): Invite[] {
		return this.invites.array().filter(fn);
	}
}

export { InviteStore };

export default InviteStore;
