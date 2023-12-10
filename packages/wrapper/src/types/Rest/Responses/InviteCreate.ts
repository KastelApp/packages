import type { ResponseBody } from '../index.js';

export interface RawInviteResponse {
	Code: string;
	CreatedAt: string;
	CreatorId: string;
	Deleteable: boolean;
	ExpiresAt: string;
	MaxUses: number;
	Uses: number;
}

export type InviteResponse = RawInviteResponse & ResponseBody;
