import { ChannelTypes, PermissionOverrideTypes } from '../../../Utils/Constants.js';
import PermissionHandler from '../../../Utils/PermissionHandler.js';
import { Endpoints } from '../../../Utils/R&E.js';
import StringFormatter from '../../../Utils/StringFormatter.js';
import type { CreateChannelOptions } from '../../../types/Client/Options.js';
import type { Channel } from '../../../types/Rest/Responses/Channel.js';
import type { RawInviteResponse } from '../../../types/Rest/Responses/InviteCreate.js';
import type { Guild as GuildType } from '../../../types/Websocket/Payloads/Auth.js';
import type { Client } from '../../Client.js';
import { GuildMemberStore } from '../../Stores/index.js';
import BaseChannel from '../Channels/BaseChannel.js';
import CategoryChannel from '../Channels/CategoryChannel.js';
import TextChannel from '../Channels/TextChannel.js';
import BaseUser from '../Users/BaseUser.js';
import GuildMember from './GuildMember.js';
import Invite from './Invite.js';
import Role from './Role.js';

class Guild {
	private readonly Client: Client;

	public readonly owner: boolean;

	public readonly permissions: PermissionHandler;

	public readonly coOwners: string[];

	public readonly description: string | null;

	public readonly flags: number;

	public readonly icon: string | null;

	public readonly id: string;

	public readonly maxMembers: number;

	public readonly name: string;

	public readonly partial: boolean = false;

	public members: GuildMemberStore;

	public constructor(client: Client, RawGuild: GuildType, partial?: boolean) {
		this.Client = client;

		if (!this.Client) {
			throw new Error('[Wrapper] [BaseGuild] You cannot create a guild without a client');
		}

		this.id = RawGuild.Id;

		this.name = RawGuild.Name;

		this.icon = null;

		this.flags = RawGuild.Flags;

		this.owner = RawGuild.OwnerId === this.Client.users.getCurrentUser()?.id;

		this.members = new GuildMemberStore(this.Client);

		this.maxMembers = RawGuild.MaxMembers;

		this.description = RawGuild.Description;

		this.partial = partial ?? false;

		this.coOwners = RawGuild.CoOwners;

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
			if (this.members.get(guildMember.User.Id)) {
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

				this.members.set(guildMember.User.Id, new GuildMember(this.Client, guildMember, this));
			}
		}

		this.permissions = new PermissionHandler(
			this.Client.users.getCurrentUser()?.id ?? '',
			this.owner
				? 'owner'
				: this.coOwners.includes(this.Client.users.getCurrentUser()?.id ?? '')
				? 'coowner'
				: 'member',
			this.members.get(this.Client.users.getCurrentUser()?.id ?? '')?.roles.map((role) => ({
				id: role.id,
				permissions: role.permissions.string(),
				position: role.position,
			})) ?? [],
			this.channels.map((channel) => ({
				id: channel.id,
				overrides: channel.permissionsOverrides.map((override) => ({
					allow: override.allow.string(),
					deny: override.deny.string(),
					id: override.id,
					type: override.type === PermissionOverrideTypes.Role ? 'Role' : 'Member',
				})),
			})),
		);
	}

	public get channels() {
		return this.Client.channels.filter((channel) => channel.guildId === this.id);
	}

	public get roles() {
		return this.Client.roles.filter((role) => role.guildId === this.id);
	}

	public async delete() {
		const DeletedGuild = await this.Client.Rest.delete(Endpoints.Guild(this.id));

		if (DeletedGuild.statusCode === 202) {
			this.Client.guilds.guilds.delete(this.id);

			return true;
		}

		return false;
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

	public async fetchMyInvites() {
		const Invites = await this.Client.Rest.get<RawInviteResponse[]>(Endpoints.GuildInvite(this.id, '@me'));

		for (const inv of Invites.json ?? []) {
			this.Client.invites.set(inv.Code, new Invite(this.Client, inv as any));

			StringFormatter.log(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.orange('[Client]')} Adding Invite ${inv.Code}`,
				inv,
			);
		}

		return this.Client.invites.filter((invite) => invite.guild?.id === this.id);
	}
}

export default Guild;

export { Guild };
