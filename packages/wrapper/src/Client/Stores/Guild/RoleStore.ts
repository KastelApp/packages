import type Client from '../../Client';
import type Role from '../../Structures/Guilds/Role';
import BaseStore from '../BaseStore.js';

/**
 * A store for guilds.
 */
class RoleStore {
	public roles: BaseStore<string, Role>;

	private readonly client: Client;

	public constructor(client: Client) {
		this.roles = new BaseStore<string, Role>();

		this.client = client;

		if (this.client) {
			//
		}
	}

	public get(id: string): Role | undefined {
		return this.roles.get(id);
	}

	public set(id: string, value: Role): this {
		this.roles.set(id, value);

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
