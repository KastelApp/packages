import { ChannelTypes } from '../../../Utils/Constants.js';
import { Endpoints } from '../../../Utils/R&E.js';
import type { CreateInvite, CreateInviteResponse } from '../../../types/Client/index.js';
import type { InviteResponse } from '../../../types/Rest/Responses/InviteCreate.js';
import type { Channel } from '../../../types/Websocket/Payloads/Auth.js';
import type { Client } from '../../Client.js';
import Permissions from '../Permissions.js';

class BaseChannel {
	public readonly Client: Client;

	public readonly type: keyof typeof ChannelTypes;

	public readonly id: string;

	public readonly name: string;

	public readonly guildId: string | undefined;

	public readonly position: number;

	public parentId: string | undefined;

	public readonly description: string | undefined;

	public permissionsOverrides: {
		allow: Permissions;
		deny: Permissions;
		editable: boolean;
		id: string;
		slowmode: number;
		type: number;
	}[];

	public children: string[] = [];

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

		this.parentId = RawChannel.ParentId;

		this.description = RawChannel.Description;

		this.children = RawChannel.Children;

		this.permissionsOverrides = RawChannel.PermissionsOverrides.map((override) => ({
			allow: new Permissions(override.Allow),
			deny: new Permissions(override.Deny),
			id: override.Id,
			type: override.Type,
			slowmode: override.Slowmode,
			editable: override.Editable,
		}));

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

	public setPosition(position: number) {
		if (position) {
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

	public isTextBased() {
		return (
			this.type === 'GuildText' ||
			this.type === 'Dm' ||
			this.type === 'GroupChat' ||
			this.type === 'GuildRules' ||
			this.type === 'GuildNews' ||
			this.type === 'GuildNewMember'
		);
	}

	public isChattable() {
		// soon check roles & permission overrides
		return (
			this.type === 'GuildText' ||
			this.type === 'Dm' ||
			this.type === 'GroupChat' ||
			this.type === 'GuildNewMember' ||
			this.type === 'GuildRules' ||
			this.type === 'GuildNews'
		);
	}

	public async createInvite(options: CreateInvite): Promise<CreateInviteResponse> {
		if (!this.isTextBased() || this.type === 'GroupChat' || this.type === 'Dm') {
			throw new Error('[Wrapper] [BaseChannel] [createInvite] You can only create invites in text channels');
		}

		const { json } = await this.Client.Rest.post<InviteResponse>(Endpoints.GuildInvites(this.guildId as string), {
			body: {
				MaxUses: options.maxUses ?? 0,
				ChannelId: this.id,
				Type: 1,
			},
		});

		if (json.CreatorId) {
			return {
				success: true,
				code: json.Code,
				expiresAt: json.ExpiresAt,
				maxUses: json.MaxUses,
			};
		}

		return {
			success: false,
			code: null,
			expiresAt: null,
			maxUses: null,
			errors: {
				invalidChannel: Object.keys(json?.Errors ?? {}).some((key) => json.Errors?.[key]?.Code === 'InvalidChannelId'),
				noPermissions: Object.keys(json?.Errors ?? {}).some((key) => json.Errors?.[key]?.Code === 'MissingPermissions'),
			},
		};
	}
}

export { BaseChannel };

export default BaseChannel;
