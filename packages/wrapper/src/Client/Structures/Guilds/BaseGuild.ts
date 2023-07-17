import type { BasedGuild } from '../../../types/Client/Structures/Guilds/index.js';
import type { Client } from '../../Client.js';
import BaseChannel from '../Channels/BaseChannel.js';

class BaseGuild {
	private readonly Client: Client;

	public readonly owner: boolean;

	public readonly permissions: BigInt;

	public readonly description: string;

	public readonly flags: number;

	public readonly icon: string | null;

	public readonly id: string;

	public readonly maxMembers: number;

	public readonly name: string;

	public constructor(client: Client, RawGuild: BasedGuild) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseGuild] You cannot create a guild without a client');
		}

		this.id = RawGuild.Id;

		this.name = RawGuild.Name;

		this.icon = null;

		this.flags = RawGuild.Flags;

		this.owner = RawGuild.Owner.Id === this.Client.users.getCurrentUser()?.id;

		this.permissions = 0n; // RawGuild.Roles.reduce((a, b) => a | BigInt(b.Permissions), 0n);

		this.maxMembers = RawGuild.MaxMembers;

		this.description = RawGuild.Description;

		for (const channel of RawGuild.Channels) {
			if (this.Client.channels.get(channel.Id)) {
				continue;
			} else {
				this.Client.channels.set(channel.Id, new BaseChannel(this.Client, channel, this.id));
			}
		}
	}

	// public get channels() {
	//     //

	//     return {
	//         cache: {
	//             get: (id: string) => {

	//             }
	//         }
	//     };
	// }
}

export default BaseGuild;

export { BaseGuild };
