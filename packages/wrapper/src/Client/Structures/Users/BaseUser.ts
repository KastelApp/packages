import type { BasedUser } from '../../../types/Client/Structures/Users/index';
import type { Client } from '../../Client.js';

class BaseUser {
	private readonly Client: Client;

	private _RawUser: BasedUser;

	public readonly username: string;

	public readonly discriminator: string;

	public readonly avatar: string | null;

	public readonly id: string;

	public readonly email: string | null;

	public readonly verified: boolean | null;

	public readonly phone: string | null;

	public readonly flags: number;

	public readonly twoFa: boolean;

	public readonly twoFaVerified: boolean;

	public readonly globalNickname: string | null;

	private readonly _client: boolean = false;

	public constructor(Client: Client, RawUser: BasedUser, isClient?: boolean) {
		this.Client = Client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseUser] You cannot create a user without a client');
		}

		this._RawUser = RawUser;

		this.username = this._RawUser.Username;

		this.discriminator = this._RawUser.Tag;

		this.avatar = this._RawUser.AvatarHash ?? null;

		this.id = this._RawUser.Id;

		this.email = this._RawUser.Email ?? null;

		this.verified = this._RawUser.EmailVerified ?? null;

		this.phone = this._RawUser.PhoneNumber ?? null;

		this.flags = this._RawUser.PublicFlags;

		this.twoFa = this._RawUser.TwoFa;

		this.twoFaVerified = this._RawUser.TwoFaVerified;

		this.globalNickname = null;

		this._client = isClient ?? false;
	}

	public set RawUser(RawUser: BasedUser) {
		this._RawUser = RawUser;
	}

	public isClient(): boolean {
		return this._client ?? false;
	}

	public get tag(): string {
		return `${this.username}#${this.discriminator}`;
	}
}

export { BaseUser };

export default BaseUser;
