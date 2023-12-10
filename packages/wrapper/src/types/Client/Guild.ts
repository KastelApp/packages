import type Guild from '../../Client/Structures/Guilds/Guild.js';
import type { ResponseBody } from '../Rest';
import type { Guild as GuildType } from '../Websocket/Payloads/Auth';

export type GuildResponse = GuildType & ResponseBody;

export interface CreateGuildSuccess {
	guild: Guild;
	success: true;
}

export interface CreateGuildError {
	errors: {
		description: boolean;
		maxGuilds?: boolean;
		name: boolean;
	};
	success: false;
}

export type CreateGuild = CreateGuildError | CreateGuildSuccess;
