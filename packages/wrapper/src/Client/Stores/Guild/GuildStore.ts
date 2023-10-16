import { type Writable, writable } from 'svelte/store';
import { Endpoints } from '../../../Utils/R&E.js';
import type { CreateGuild, GuildResponse } from '../../../types/Client/Guild';
import type Client from '../../Client';
import BaseGuild from '../../Structures/Guilds/BaseGuild.js';
import BaseStore from '../BaseStore.js';

/**
 * A store for Guilds.
 */
class GuildStore {
	public guildStore: Writable<BaseStore<string, BaseGuild>>;

	private readonly client: Client;

	public _currentGuild: string | null;

	public guilds: BaseStore<string, BaseGuild> = new BaseStore();

	public constructor(client: Client) {
		this.guildStore = writable(new BaseStore<string, BaseGuild>());

		this.client = client;

		if (this.client) {
			//
		}

		this.guildStore.subscribe((value) => {
			this.guilds = value;
		});

		this._currentGuild = null;
	}

	public get(id: string): BaseGuild | undefined {
		return this.guilds.get(id);
	}

	public set(id: string, value: BaseGuild): this {
		this.guilds.set(id, value);
		this.guildStore.set(this.guilds);

		return this;
	}

	public get currentGuild(): BaseGuild | undefined {
		return this.guilds.get(this._currentGuild ?? '');
	}

	public toArray(): BaseGuild[] {
		return this.guilds.array();
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

	public async createGuild({ description, name }: { description: string; name: string }): Promise<CreateGuild> {
		const { statusCode, json } = await this.client.Rest.post<GuildResponse>(Endpoints.Guild(), {
			body: {
				Name: name,
				Description: description,
			},
		});

		if (statusCode !== 201) {
			const NameError = json.Errors?.Name;
			const MaxGuildError = json.Errors?.Guilds;

			return {
				success: false,
				errors: {
					description: false,
					name: NameError?.Code === 'MissingName',
					maxGuilds: MaxGuildError?.Code === 'MaxGuildsReached',
				},
			};
		}

		const Guild = new BaseGuild(this.client, json);

		this.guilds.set(Guild.id, Guild);

		return {
			success: true,
			guild: Guild,
		};
	}

	public clear(): void {
		this.guilds.clear();
		this.guildStore.set(this.guilds);
	}
}

export { GuildStore };

export default GuildStore;
