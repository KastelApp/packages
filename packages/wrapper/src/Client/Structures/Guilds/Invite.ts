import type { RawInviteResponse } from '../../../types/Rest/Responses/InviteCreate.js';
import type { RawFetchedInvite } from '../../../types/Rest/Responses/InviteFetch.js';
import type Client from '../../Client.js';
import type BaseChannel from '../Channels/BaseChannel.js';
import type BaseUser from '../Users/BaseUser.js';
import type Guild from './Guild.js';

class Invite {
	public readonly Client: Client;

	public readonly code: string;

	public readonly guild: Guild | null;

	public readonly creator: BaseUser | null;

	public readonly createdAt: Date | null;

	public readonly expiresAt: Date | null;

	public readonly maxUses: number | null;

	public readonly uses: number | null;

	public readonly deleteable: boolean;

	public readonly channel: BaseChannel | null;

	public constructor(client: Client, rawInvite: RawFetchedInvite & RawInviteResponse) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [Invite] You cannot create an invite without a client');
		}

		this.code = rawInvite.Code;

		this.guild = rawInvite.Guild?.Id ? (this.Client.guilds.get(rawInvite.Guild.Id) as Guild) : null;

		this.creator = rawInvite?.CreatorId
			? (this.Client.users.get(rawInvite.CreatorId) as BaseUser)
			: rawInvite.Creator.Id
			? (this.Client.users.get(rawInvite.Creator.Id) as BaseUser)
			: null;

		this.createdAt = rawInvite?.CreatedAt ? new Date(rawInvite.CreatedAt) : null;

		this.expiresAt = rawInvite?.ExpiresAt ? new Date(rawInvite.ExpiresAt) : null;

		this.maxUses = rawInvite?.MaxUses ?? null;

		this.uses = rawInvite?.Uses ?? null;

		this.deleteable = rawInvite?.Deleteable ?? false;

		this.channel = rawInvite.Channel?.Id ? (this.Client.channels.get(rawInvite.Channel.Id) as BaseChannel) : null;
	}

	public async delete() {
		throw new Error('[Wrapper] [Invite] This method is not implemented yet');
	}
}

export { Invite };

export default Invite;
