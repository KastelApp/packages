import { type Writable, writable } from 'svelte/store';
import type Client from '../../Client';
import type Role from '../../Structures/Guilds/Role';
import BaseStore from '../BaseStore.js';

/**
 * A store for guilds.
 */
class RoleStore {
	public roleStore: Writable<BaseStore<string, Role>>;

	private readonly client: Client;

	public roles: BaseStore<string, Role> = new BaseStore();

	public constructor(client: Client) {
		this.roleStore = writable(new BaseStore<string, Role>());

		this.client = client;

		if (this.client) {
			//
		}

		this.roleStore.subscribe((value) => {
			this.roles = value;
		});
	}

	public get(id: string): Role | undefined {
		return this.roles.get(id);
	}

	public set(id: string, value: Role): this {
		this.roles.set(id, value);
		this.roleStore.set(this.roles);

		return this;
	}

	public toArray(): Role[] {
		return this.roles.array();
	}

	public filter(fn: (value: Role, index: number, array: Role[]) => unknown): Role[] {
		return this.roles.array().filter(fn);
	}
}

export { RoleStore };

export default RoleStore;
