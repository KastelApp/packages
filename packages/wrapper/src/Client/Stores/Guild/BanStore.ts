import { type Writable, writable } from 'svelte/store';
import type Client from '../../Client';
import type Ban from '../../Structures/Guilds/Ban';
import BaseStore from '../BaseStore.js';

/**
 * A store for guilds.
 */
class BanStore {
	public banStore: Writable<BaseStore<string, Ban>>;

	private readonly client: Client;

	public bans: BaseStore<string, Ban> = new BaseStore();

	public constructor(client: Client) {
		this.banStore = writable(new BaseStore<string, Ban>());

		this.client = client;

		if (this.client) {
			//
		}

		this.banStore.subscribe((value) => {
			this.bans = value;
		});
	}
}

export { BanStore };

export default BanStore;
