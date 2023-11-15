import { Endpoints } from "../../../Utils/R&E.js";
import type { CreateGuild, GuildResponse } from "../../../types/Client/Guild";
import type Client from "../../Client";
import BaseGuild from "../../Structures/Guilds/BaseGuild.js";
import BaseStore from "../BaseStore.js";

/**
 * A store for Guilds.
 */
class GuildStore {
	private readonly client: Client;

	public _currentGuild: string | null;

	public guilds: BaseStore<string, BaseGuild> = new BaseStore();

	public constructor(client: Client) {
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
		return this.guilds.get(this._currentGuild ?? "");
	}

	public toArray(): BaseGuild[] {
		return this.guilds.array();
	}

	public setCurrentGuild(value: BaseGuild | string | undefined) {
		if (value instanceof BaseGuild) {
			this._currentGuild = value.id;
		} else if (typeof value === "string") {
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
					name: NameError?.Code === "MissingName",
					maxGuilds: MaxGuildError?.Code === "MaxGuildsReached",
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
	}
}

export { GuildStore };

export default GuildStore;
