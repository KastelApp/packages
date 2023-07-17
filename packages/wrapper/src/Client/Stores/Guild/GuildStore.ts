import type Client from '../../Client';
import BaseGuild from '../../Structures/Guilds/BaseGuild.js';
import BaseStore from '../BaseStore.js';

/**
 * A store for guilds.
 */
class GuildStore {
	public guilds: BaseStore<string, BaseGuild>;

	private readonly client: Client;

	public _currentGuild: string | null;

	public constructor(client: Client) {
		this.guilds = new BaseStore<string, BaseGuild>();

		this.client = client;

		if (this.client) {
			//
		}

		this._currentGuild = null;
	}

	public get(id: string): BaseGuild | undefined {
		return this.guilds.get(id);
	}

	public set(id: string, value: BaseGuild): this {
		this.guilds.set(id, value);

		return this;
	}

	public get currentGuild(): BaseGuild | undefined {
		return this.guilds.get(this._currentGuild ?? '');
	}

	public setCurrentGuild(value: BaseGuild | string | undefined) {
		if (value instanceof BaseGuild) {
			this._currentGuild = value.id;
		} else if (typeof value === 'string') {
			this._currentGuild = value;
		} else {
			this._currentGuild = null;
		}
	}
}

export { GuildStore };

export default GuildStore;
