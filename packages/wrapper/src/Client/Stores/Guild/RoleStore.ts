import type Client from "../../Client";
import type Role from "../../Structures/Guilds/Role";
import BaseStore from "../BaseStore.js";

/**
 * A store for Roles.
 */
class RoleStore {
	private readonly client: Client;

	public roles: BaseStore<string, Role> = new BaseStore();

	public constructor(client: Client) {
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

	public clear(): void {
		this.roles.clear();
	}
}

export { RoleStore };

export default RoleStore;
