import { type Writable, writable } from 'svelte/store';
import type Client from '../../Client';
import type Invite from '../../Structures/Guilds/Invite';
import BaseStore from '../BaseStore.js';

/**
 * A store for guilds.
 */
class InviteStore {
	public inviteStore: Writable<BaseStore<string, Invite>>;

	private readonly client: Client;

	public invites: BaseStore<string, Invite> = new BaseStore();

	public constructor(client: Client) {
		this.inviteStore = writable(new BaseStore<string, Invite>());

		this.client = client;

		if (this.client) {
			//
		}

		this.inviteStore.subscribe((value) => {
			this.invites = value;
		});
	}
}

export { InviteStore };

export default InviteStore;
