import type { ResponseBody } from '../index.js';

// @ts-expect-error -- Code is provided in both responses
export interface InviteResponse extends ResponseBody {
	Code: string;
	CreatorId: string;
	Deleteable: boolean;
	ExpiresAt: string;
	MaxUses: number;
	Uses: number;
}
