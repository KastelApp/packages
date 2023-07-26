import { ChannelTypes } from '../../../Utils/Constants.js';
import { Endpoints } from '../../../Utils/R&E.js';
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

	private readonly _raw: Channel;

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

		this._raw = RawChannel;
	}

	public async setName(name: string) {
		if (!name) return false;

		//

		const PatchedChannel = await this.Client.Rest.patch(Endpoints.Channel(this.id), {
			body: {
				...this._raw,
				Name: name,
			},
		});

		if (PatchedChannel) {
			//
		}

		return true;
	}

	public setDescription(description: string) {
		if (description) {
			//
		}

		return this;
	}

	public setPosition(position: number) {
		if (position) {
			//
		}

		return this;
	}

	public setParent(parentId: string) {
		if (parentId) {
			//
		}

		return this;
	}

	public delete() {
		//

		return this;
	}

	public toString() {
		return `<#${this.id}>`;
	}

	public toJSON() {
		return {
			type: this.type,
			id: this.id,
			name: this.name,
			guildId: this.guildId,
			position: this.position,
			parentId: this.parentId,
			description: this.description,
		};
	}
}

export { BaseChannel };

export default BaseChannel;
