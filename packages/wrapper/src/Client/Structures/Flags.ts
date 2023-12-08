import { Flags as FlagsConstant } from '../../Utils/Constants.js';

class Flags {
	private SetFlags: bigint;

	public constructor(Flags: bigint | number | string) {
		this.SetFlags = BigInt(Flags);
	}

	public has(Flag: bigint | number | keyof typeof FlagsConstant) {
		const FoundFlag = typeof Flag === 'string' ? FlagsConstant[Flag] : BigInt(Flag);

		return (this.SetFlags & FoundFlag) === FoundFlag;
	}

	public add(Flag: bigint | number | keyof typeof FlagsConstant) {
		const FoundFlag = typeof Flag === 'string' ? FlagsConstant[Flag] : BigInt(Flag);

		this.SetFlags |= FoundFlag;

		return this.SetFlags;
	}

	public remove(Flag: bigint | number | keyof typeof FlagsConstant) {
		const FoundFlag = typeof Flag === 'string' ? FlagsConstant[Flag] : BigInt(Flag);

		this.SetFlags &= ~FoundFlag;

		return this.SetFlags;
	}

	public toArray() {
		return Object.entries(FlagsConstant)
			.filter(([, value]) => this.has(value))
			.map(([key]) => key);
	}

	public toJSON() {
		return Object.fromEntries(Object.entries(FlagsConstant).map(([key, value]) => [key, this.has(value)]));
	}
}

export default Flags;

export { Flags };
