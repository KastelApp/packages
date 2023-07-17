export interface Channel {
	AllowedMentions: number;
	Children: string[];
	Description?: string;
	Id: string;
	Name: string;
	Parent?: string;
	Position: number;
	Type: number;
}
