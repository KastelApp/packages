import type Client from '../Client';
import type BaseUser from '../Structures/Users/BaseUser.js';
import BaseStore from './BaseStore.js';

/**
 * A store for users.
 */
class UserStore {
	public users: BaseStore<string, BaseUser>;

	private readonly client: Client;

	public constructor(client: Client) {
		this.users = new BaseStore<string, BaseUser>();

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
}

export { UserStore };

export default UserStore;
