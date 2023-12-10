import { Endpoints } from '../../../Utils/R&E.js';
import type { CreateGuild, GuildResponse } from '../../../types/Client/Guild';
import type Client from '../../Client';
import Guild from '../../Structures/Guilds/Guild.js';
import BaseStore from '../BaseStore.js';

/**
 * A store for Guilds.
 */
class GuildStore {
	private readonly client: Client;

	public _currentGuild: string | null;

	public guilds: BaseStore<string, Guild> = new BaseStore();

	public constructor(client: Client) {
		this.client = client;

		if (this.client) {
			//
		}

		this._currentGuild = null;
	}

	public get(id: string): Guild | undefined {
		return this.guilds.get(id);
	}

	public set(id: string, value: Guild): this {
		this.guilds.set(id, value);

		return this;
	}

	public get currentGuild(): Guild | undefined {
		return this.guilds.get(this._currentGuild ?? '');
	}

	public toArray(): Guild[] {
		return this.guilds.array();
	}

	public setCurrentGuild(value: Guild | string | undefined) {
		if (value instanceof Guild) {
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

		const NewGuild = new Guild(this.client, json);

		if (!this.guilds.has(NewGuild.id)) this.guilds.set(NewGuild.id, NewGuild);

		return {
			success: true,
			guild: NewGuild,
		};
	}

	public clear(): void {
		this.guilds.clear();
	}

	public filter(fn: (value: Guild, index: number, array: Guild[]) => unknown): Guild[] {
		return this.guilds.array().filter(fn);
	}
}

export { GuildStore };

export default GuildStore;
