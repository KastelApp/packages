export interface CreateChannelOptions {
	children?: string[];
	description?: string;
	name: string;
	nsfw?: boolean;
	parentId?: string;
	permissionsOverrides?: {
		[key: string]: {
			allow: string;
			deny: string;
			slowmode: number;
			type: number;
		};
	};
	position?: number;
	slowmode?: number;
	type: number;
}
