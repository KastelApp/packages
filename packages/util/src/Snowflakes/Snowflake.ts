import type { SnowConfig } from '../types/Snowflake';

class Snowflake {
	public Epoch: bigint;

	public Increment: bigint;

	public TimeShift: bigint;

	public WorkerIdProcessId: bigint;

	public constructor(config: SnowConfig) {
		this.Epoch = BigInt(new Date(Number(config.Epoch || 1_641_016_800_000)).getTime());

		this.Increment = 0n;

		this.TimeShift =
			BigInt(config.SequenceBytes || 15) + BigInt(config.WorkerIdBytes || 6) + BigInt(config.ProcessIdBytes || 7);

		this.WorkerIdProcessId =
			(BigInt(config.WorkerId || 1) << BigInt(config.SequenceBytes || 15)) |
			(BigInt(config.ProcessId || 0) << (BigInt(config.SequenceBytes || 15) + BigInt(config.WorkerIdBytes || 6)));
	}

	public Generate(timestamp: Date | number = Date.now()): string {
		if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
			throw new TypeError(
				`'timestamp' expected to be number but got ${Number.isNaN(timestamp as number) ? 'NaN' : typeof timestamp}`,
			);
		}

		const TimeShift = BigInt(BigInt(timestamp) - this.Epoch) << this.TimeShift;

		if (this.Increment >= 4_095n) this.Increment = 0n;

		return (TimeShift | this.WorkerIdProcessId | this.Increment++).toString();
	}

	public MassGenerate(amount = 5): string[] {
		if (typeof amount !== 'number' || Number.isNaN(amount)) {
			throw new TypeError(`'amount' expected to be number but got ${Number.isNaN(amount) ? 'NaN' : typeof amount}`);
		}

		const Ids = [];

		for (let idCount = 0; idCount < Number(amount); idCount++) {
			Ids.push(this.Generate());
		}

		return Ids;
	}

	public TimeStamp(snowflake: string): number {
		return Number((BigInt(snowflake) >> this.TimeShift) + this.Epoch);
	}

	public Validate(snowflake: string): boolean {
		if (typeof snowflake !== 'string') {
			throw new TypeError(`'snowflake' expected to be string but got ${typeof snowflake}`);
		}

		const length = /^\d{17,21}$/.test(snowflake);

		if (!length) return false;

		const timestamp = this.TimeStamp(snowflake);

		return timestamp >= Number(this.Epoch) && timestamp <= Date.now();
	}
}

export default Snowflake;

export { Snowflake };
