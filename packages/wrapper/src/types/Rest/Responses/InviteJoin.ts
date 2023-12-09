import type { ResponseBody } from '../index.js';

export interface InviteJoin extends ResponseBody {
	Description: string;
	Features: string[];
	Id: string;
	Name: string;
}
