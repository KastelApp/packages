import type { ResponseBody } from "..";

export interface RegisterResponse extends ResponseBody {
	Token: string;
	User: User;
}

export interface User {
	Avatar: any;
	Email: string;
	Id: string;
	PublicFlags: number;
	Tag: string;
	Username: string;
}
