import { type Writable, writable } from 'svelte/store';
import type Client from '../Client';
import type BaseUser from '../Structures/Users/BaseUser.js';
import BaseStore from './BaseStore.js';

/**
 * A store for Users.
 */
class UserStore {
	public userStore: Writable<BaseStore<string, BaseUser>>;

	private readonly client: Client;

	public users: BaseStore<string, BaseUser> = new BaseStore();

	public constructor(client: Client) {
		this.userStore = writable(new BaseStore<string, BaseUser>());

		this.client = client;

		if (this.client) {
			//
		}

		this.userStore.subscribe((value) => {
			this.users = value;
		});
	}

	public get(id: string): BaseUser | undefined {
		return this.users.get(id);
	}

	public set(id: string, value: BaseUser): this {
		this.users.set(id, value);
		this.userStore.set(this.users);

		return this;
	}

	public getCurrentUser(): BaseUser | undefined {
		return this.users.array().find((user) => user.isClient());
	}

	public clear(): void {
		this.users.clear();
		this.userStore.set(this.users);
	}
}

export { UserStore };

export default UserStore;
