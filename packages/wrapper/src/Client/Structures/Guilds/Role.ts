import type { Role as RoleType } from '../../../types/Websocket/Payloads/Auth.js';
import type { Client } from '../../Client.js';

class Role {
	private readonly Client: Client;

	// private readonly raw_: RoleType;

	public id: string;

	public name: string;

	public permissions: bigint;

	public position: number;

	public color: number;

	public hoisted: boolean;

	public deletable: boolean;

	public allowedNsfw: boolean;

	public allowedMentions: number;

	public constructor(client: Client, RawRole: RoleType) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseRole] You cannot create a guild without a client');
		}

		this.id = RawRole.Id;

		this.name = RawRole.Name;

		this.permissions = BigInt(RawRole.Permissions);

		this.position = RawRole.Position;

		this.color = RawRole.Color;

		this.hoisted = RawRole.Hoisted;

		this.deletable = RawRole.Deleteable;

		this.allowedNsfw = RawRole.AllowedNsfw;

		this.allowedMentions = RawRole.AllowedMenions;

		// this.raw_ = RawRole;
	}
}

export default Role;

export { Role };
