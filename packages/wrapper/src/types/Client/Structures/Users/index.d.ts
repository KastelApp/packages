export interface BasedUser {
	AvatarHash: string | null;
	Email: string;
	EmailVerified: boolean;
	Id: string;
	PhoneNumber: string | null;
	PublicFlags: number;
	Tag: string;
	TwoFa: boolean;
	TwoFaVerified: boolean;
	Username: string;
}
