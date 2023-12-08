import { ChannelTypes } from '../../../Utils/Constants.js';
import { Endpoints } from '../../../Utils/R&E.js';
import type { CreateChannelOptions } from '../../../types/Client/Options.js';
import type { Channel } from '../../../types/Rest/Responses/Channel.js';
import type { Guild } from '../../../types/Websocket/Payloads/Auth.js';
import type { Client } from '../../Client.js';
import BaseChannel from '../Channels/BaseChannel.js';
import CategoryChannel from '../Channels/CategoryChannel.js';
import TextChannel from '../Channels/TextChannel.js';
import BaseUser from '../Users/BaseUser.js';
import GuildMember from './GuildMember.js';
import Role from './Role.js';

class BaseGuild {
	private readonly Client: Client;

	public readonly owner: boolean;

	public readonly permissions: BigInt;

	public readonly description: string | null;

	public readonly flags: number;

	public readonly icon: string | null;

	public readonly id: string;

	public readonly maxMembers: number;

	public readonly name: string;

	public constructor(client: Client, RawGuild: Guild) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseGuild] You cannot create a guild without a client');
		}

		this.id = RawGuild.Id;

		this.name = RawGuild.Name;

		this.icon = null;

		this.flags = RawGuild.Flags;

		this.owner = RawGuild.OwnerId === this.Client.users.getCurrentUser()?.id;

		this.permissions = 0n; // RawGuild.Roles.reduce((a, b) => a | BigInt(b.Permissions), 0n);

		this.maxMembers = RawGuild.MaxMembers;

		this.description = RawGuild.Description;

		for (const channel of RawGuild.Channels) {
			if (this.Client.channels.get(channel.Id)) {
				continue;
			} else {
				switch (channel.Type) {
					case ChannelTypes.GuildCategory: {
						this.Client.channels.set(channel.Id, new CategoryChannel(this.Client, channel, this.id));

						break;
					}

					case ChannelTypes.GuildText: {
						this.Client.channels.set(channel.Id, new TextChannel(this.Client, channel, this.id));

						break;
					}
				}
			}
		}

		for (const role of RawGuild.Roles) {
			if (this.Client.roles.get(role.Id)) {
				continue;
			} else {
				this.Client.roles.set(role.Id, new Role(this.Client, role, this.id));
			}
		}

		for (const guildMember of RawGuild.Members ?? []) {
			if (this.Client.guildMembers.get(guildMember.User.Id)) {
				continue;
			} else {
				if (!this.Client.users.get(guildMember.User.Id)) {
					this.Client.users.set(
						guildMember.User.Id,
						new BaseUser(
							this.Client,
							{
								Avatar: guildMember.User.Avatar,
								GlobalNickname: guildMember.User.GlobalNickname,
								Id: guildMember.User.Id,
								PublicFlags: Number(guildMember.User.Flags),
								Tag: guildMember.User.Tag,
								Username: guildMember.User.Username,
							},
							false,
						),
					);
				}

				this.Client.guildMembers.set(guildMember.User.Id, new GuildMember(this.Client, guildMember, this));
			}
		}
	}

	public get channels() {
		return this.Client.channels.filter((channel) => channel.guildId === this.id);
	}

	public get roles() {
		return this.Client.roles.filter((role) => role.guildId === this.id);
	}

	public async createChannel({
		name,
		children,
		description,
		nsfw,
		parentId,
		permissionsOverrides,
		position,
		slowmode,
		type,
	}: CreateChannelOptions) {
		if (parentId && !this.Client.channels.get(parentId)) {
			return null;
		}

		if (children) {
			for (const child of children) {
				if (!this.Client.channels.get(child)) {
					return null;
				}
			}
		}

		const Channel = await this.Client.Rest.post<Channel>(Endpoints.GuildChannels(this.id), {
			body: {
				Name: name,
				Children: children,
				Description: description,
				Nsfw: nsfw,
				ParentId: parentId,
				PermissionsOverrides: permissionsOverrides,
				Position: position,
				Slowmode: slowmode,
				Type: type,
			},
		});

		if (Channel && Channel.statusCode === 201) {
			const NewChannel = new BaseChannel(this.Client, Channel.json, this.id);

			this.Client.channels.set(Channel.json.Id, NewChannel);

			if (parentId) {
				const ParentChannel = this.Client.channels.get(parentId);

				if (ParentChannel) {
					ParentChannel.children.push(Channel.json.Id);
				}
			}

			if (children) {
				for (const child of children) {
					const ChildChannel = this.Client.channels.get(child);

					if (ChildChannel) {
						ChildChannel.parentId = Channel.json.Id;
					}
				}
			}

			return NewChannel;
		} else if (Channel.statusCode !== 201) {
			console.error(Channel);
		}

		return null;
	}
}

export default BaseGuild;

export { BaseGuild };
