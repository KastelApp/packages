import type { PermissionsOverrides } from "../../RawTypes/PermissionOverride";

export interface ChannelPayload {
	AllowedMentions: number;
	Children: string[];
	Description: string;
	GuildId?: string;
	Id: string;
	Name: string;
	Nsfw: boolean;
	ParentId: string;
	PermissionsOverrides: PermissionsOverrides[];
	Position: number;
	Slowmode: number;
	Type: number;
}
