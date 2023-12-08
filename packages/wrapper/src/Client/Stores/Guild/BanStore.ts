import type Client from '../../Client';
import type Ban from '../../Structures/Guilds/Ban';
import BaseStore from '../BaseStore.js';

/**
 * A store for Bans.
 */
class BanStore {
	private readonly client: Client;

	public bans: BaseStore<string, Ban> = new BaseStore();

	public constructor(client: Client) {
		this.client = client;

		if (this.client) {
			//
		}
	}

	public clear(): void {
		this.bans.clear();
	}
}

export { BanStore };

export default BanStore;
