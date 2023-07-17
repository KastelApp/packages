import { ChannelTypes } from '../../../Utils/Constants.js';
import type { Channel } from '../../../types/Client/Structures/channel.js';
import type { Client } from '../../Client.js';

class BaseChannel {
	private readonly Client: Client;

	public readonly type: keyof typeof ChannelTypes;

	public readonly id: string;

	public readonly name: string;

	public readonly guildId: string | undefined;

	public readonly position: number;

	public readonly parentId: string | undefined;

	public readonly description: string | undefined;

	public constructor(Client: Client, RawChannel: Channel, GuildId?: string) {
		this.Client = Client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseUser] You cannot create a user without a client');
		}

		this.type = Object.entries(ChannelTypes).find(
			([, value]) => value === RawChannel.Type,
		)?.[0] as keyof typeof ChannelTypes;

		this.id = RawChannel.Id;

		this.name = RawChannel.Name;

		this.guildId = GuildId;

		this.position = RawChannel.Position;

		this.parentId = RawChannel.Parent;

		this.description = RawChannel.Description;
	}
}

export { BaseChannel };

export default BaseChannel;
