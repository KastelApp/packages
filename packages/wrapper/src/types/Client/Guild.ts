import type BaseGuild from '../../Client/Structures/Guilds/BaseGuild';
import type { ResponseBody } from '../Rest';
import type { Guild } from '../Websocket/Payloads/Auth';

export type GuildResponse = Guild & ResponseBody;

interface CreateGuildSuccess {
	guild: BaseGuild;
	success: true;
}

interface CreateGuildError {
	errors: {
		description: boolean;
		maxGuilds?: boolean;
		name: boolean;
	};
	success: false;
}

export type CreateGuild = CreateGuildError | CreateGuildSuccess;
