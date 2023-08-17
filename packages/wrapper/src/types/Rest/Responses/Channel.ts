export interface PermissionOverride {
	Allow: string;
	Deny: string;
	Editable: boolean;
	Id: string; // Id of the user or role
	PermissionId: string;
	Slowmode: number;
	Type: number;
}

export interface Channel {
	AllowedMentions: number;
	Children: string[];
	Description: string;
	Id: string;
	Name: string;
	Nsfw: boolean;
	ParentId: string;
	PermissionsOverrides: PermissionOverride[];
	Position: number;
	Slowmode: number;
	Type: number;
}
