import type { ResponseBody } from '../index.js';

// @ts-expect-error -- Code is provided in both responses
export interface FetchedInvite extends ResponseBody {
	Channel: Channel;
	Code: string;
	Creator: Creator;
	Guild: Guild;
}

export interface Creator {
	Avatar: string;
	Flags: number;
	GlobalNickname: string;
	Id: string;
	PublicFlags: number;
	Tag: string;
	Username: string;
}

export interface Guild {
	Description: string;
	Features: string[];
	Icon: string | null;
	Id: string;
	Name: string;
	OwnerId: string;
}

export interface Channel {
	Id: string;
	Name: string;
	Type: number;
}
