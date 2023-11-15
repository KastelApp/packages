import { Permissions as PermissionConstants } from "../../Utils/Constants.js";

class Permissions {
	private SetPermissions: bigint;

	public constructor(Permissions: bigint | number | string) {
		this.SetPermissions = BigInt(Permissions);
	}

	public has(Permission: bigint | number | keyof typeof PermissionConstants) {
		const FoundPermission = typeof Permission === "string" ? PermissionConstants[Permission] : BigInt(Permission);

		return (this.SetPermissions & FoundPermission) === FoundPermission;
	}

	public add(Permission: bigint | number | keyof typeof PermissionConstants) {
		const FoundPermission = typeof Permission === "string" ? PermissionConstants[Permission] : BigInt(Permission);

		this.SetPermissions |= FoundPermission;

		return this.SetPermissions;
	}

	public remove(Permission: bigint | number | keyof typeof PermissionConstants) {
		const FoundPermission = typeof Permission === "string" ? PermissionConstants[Permission] : BigInt(Permission);

		this.SetPermissions &= ~FoundPermission;

		return this.SetPermissions;
	}

	public toArray() {
		return Object.entries(PermissionConstants)
			.filter(([, value]) => this.has(value))
			.map(([key]) => key);
	}

	public toJSON() {
		return Object.fromEntries(Object.entries(PermissionConstants).map(([key, value]) => [key, this.has(value)]));
	}
}

export default Permissions;

export { Permissions };
