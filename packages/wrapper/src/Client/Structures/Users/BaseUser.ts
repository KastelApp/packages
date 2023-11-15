import { Endpoints } from "../../../Utils/R&E.js";
import type { EditableUser } from "../../../types/Client/User.js";
import type { UserObject } from "../../../types/Websocket/Payloads/Auth.js";
import type { Client } from "../../Client.js";
import Flags from "../Flags.js";

class BaseUser {
	private readonly Client: Client;

	private _RawUser: UserObject;

	public readonly username: string;

	public readonly discriminator: string;

	public readonly avatar: string | null;

	public readonly id: string;

	public readonly email: string | null;

	public readonly verified: boolean | null;

	public readonly phone: string | null;

	public readonly flags: Flags;

	public readonly twoFaEnabled: boolean;

	public readonly twoFaVerified: boolean;

	public readonly globalNickname: string | null;

	public readonly bio: string | null;

	private readonly _client: boolean = false;

	public constructor(Client: Client, RawUser: UserObject, isClient?: boolean) {
		this.Client = Client;

		if (!this.Client) {
			throw new Error("[Wrapper] [BaseUser] You cannot create a user without a client");
		}

		this._RawUser = RawUser;

		this.username = this._RawUser.Username;

		this.discriminator = this._RawUser.Tag;

		this.avatar = this._RawUser.Avatar ?? null;

		this.id = this._RawUser.Id;

		this.email = this._RawUser.Email ?? null;

		this.verified = this._RawUser.EmailVerified ?? null;

		this.phone = this._RawUser.PhoneNumber ?? null;

		this.flags = new Flags(this._RawUser.PublicFlags);

		this.twoFaEnabled = this._RawUser.TwoFaEnabled ?? false;

		this.twoFaVerified = this._RawUser.TwoFaVerified ?? false;

		this.globalNickname = null;

		this.bio = this._RawUser.Bio ?? null;

		this._client = isClient ?? false;
	}

	public set RawUser(RawUser: UserObject) {
		this._RawUser = RawUser;
	}

	public fetchUser(bio = false) {
		if (bio) {
			// wad
		}
	}

	public async updateUser({
		aFlags,
		avatar,
		bio,
		email,
		globalNickname,
		newPassword,
		password,
		phoneNumber,
		rFlags,
		tag,
		username,
	}: EditableUser) {
		const { statusCode, json } = await this.Client.Rest.patch<UserObject>(Endpoints.User(), {
			body: {
				Avatar: avatar,
				Bio: bio,
				Email: email,
				GlobalNickname: globalNickname,
				NewPassword: newPassword,
				Password: password,
				PhoneNumber: phoneNumber,
				Tag: tag,
				Username: username,
				...(this.flags.has("Staff")
					? {
							AFlags: aFlags,
							RFlags: rFlags,
					  }
					: {}),
			},
		});

		if (statusCode !== 200) {
			return this;
		}

		const NewBaseUser = new BaseUser(this.Client, json, this.isClient());

		this.Client.users.set(json.Id, NewBaseUser);

		return NewBaseUser;
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
