import type Client from "../Client";
import type BaseUser from "../Structures/Users/BaseUser.js";
import BaseStore from "./BaseStore.js";

/**
 * A store for Users.
 */
class UserStore {
	private readonly client: Client;

	public users: BaseStore<string, BaseUser> = new BaseStore();

	public constructor(client: Client) {
		this.client = client;

		if (this.client) {
			//
		}
	}

	public get(id: string): BaseUser | undefined {
		return this.users.get(id);
	}

	public set(id: string, value: BaseUser): this {
		this.users.set(id, value);

		return this;
	}

	public getCurrentUser(): BaseUser | undefined {
		return this.users.array().find((user) => user.isClient());
	}

	public clear(): void {
		this.users.clear();
	}
}

export { UserStore };

export default UserStore;
