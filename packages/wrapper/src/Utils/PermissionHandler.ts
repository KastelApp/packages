import { Permissions as PermissionConstants } from './Constants.js';

class PermissionHandler {
	public type: 'coowner' | 'member' | 'owner';

	public memberRoles: {
		Id: string;
		Permissions: bigint;
		Position: number;
	}[];

	public channels: {
		id: string;
		overrides: {
			allow: bigint;
			deny: bigint;
			// Role / Member Id
			id: string;
			type: 'Member' | 'Role';
		}[];
	}[];

	public guildMemberId: string;

	public constructor(
		guildMemberId: string,
		type: 'coowner' | 'member' | 'owner',
		memberRoles: { id: string; permissions: bigint | number | string; position: number }[],
		channels?: {
			id: string;
			overrides: {
				allow: bigint | number | string;
				deny: bigint | number | string;
				id: string;
				type: 'Member' | 'Role';
			}[];
		}[],
	) {
		this.guildMemberId = guildMemberId;

		this.type = type;

		this.memberRoles = memberRoles.map((Role) => {
			return {
				Id: Role.id,
				Permissions: BigInt(Role.permissions),
				Position: Role.position,
			};
		});

		this.channels =
			channels?.map((Channel) => {
				return {
					id: Channel.id,
					overrides: Channel.overrides.map((Override) => {
						return {
							allow: BigInt(Override.allow),
							deny: BigInt(Override.deny),
							id: Override.id,
							type: Override.type,
						};
					}),
				};
			}) ?? [];
	}

	public hasAnyRole(Permission: bigint | number | keyof typeof PermissionConstants, dupe?: boolean) {
		const FoundPermission = typeof Permission === 'string' ? PermissionConstants[Permission] : BigInt(Permission);

		if (this.type === 'owner' || this.type === 'coowner') return true;

		if (!dupe && this.hasAnyRole('Administrator', true)) return true;

		return this.memberRoles.some((Role) => {
			return (Role.Permissions & FoundPermission) === FoundPermission;
		});
	}

	public canManageRole(Role: { Permissions: bigint | number | keyof typeof PermissionConstants; Position: number }) {
		if (!this.hasAnyRole('ManageRoles')) return false;

		if (this.type === 'owner' || this.type === 'coowner') return true;

		const HighestRole = this.memberRoles.sort((a, b) => b.Position - a.Position)[0];

		return !(!HighestRole?.Position || HighestRole.Position <= Role.Position);
	}

	public hasChannelPermission(channelId: string, permission: keyof typeof PermissionConstants): boolean {
		const channel = this.channels.find((channel) => channel.id === channelId);

		if (!channel) return false;

		if (this.hasAnyRole('Administrator')) return true;

		const userOverride = channel.overrides.find(
			(override) => override.type === 'Member' && override.id === this.guildMemberId,
		);
		if (userOverride) {
			if ((BigInt(userOverride.allow) & PermissionConstants[permission]) === PermissionConstants[permission])
				return true;
			if ((BigInt(userOverride.deny) & PermissionConstants[permission]) === PermissionConstants[permission])
				return false;
		}

		for (const role of this.memberRoles) {
			const roleOverride = channel.overrides.find((override) => override.type === 'Role' && override.id === role.Id);

			if (roleOverride) {
				if ((BigInt(roleOverride.allow) & PermissionConstants[permission]) === PermissionConstants[permission])
					return true;
				if ((BigInt(roleOverride.deny) & PermissionConstants[permission]) === PermissionConstants[permission])
					return false;
			}
		}

		return this.hasAnyRole(permission);
	}
}

export default PermissionHandler;
