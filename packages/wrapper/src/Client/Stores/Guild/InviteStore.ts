import type Client from "../../Client";
import type Invite from "../../Structures/Guilds/Invite";
import BaseStore from "../BaseStore.js";

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
}

export { InviteStore };

export default InviteStore;
