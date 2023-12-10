import type { SnowConfig } from '../types/Snowflake';

class Snowflake {
	public Epoch: bigint;

	public Increment: bigint;

	public TimeShift: bigint;

	public WorkerIdProcessId: bigint;

	public constructor(config: SnowConfig) {
		this.Epoch = config.Epoch ?? 1_641_016_800_000n;

		this.Increment = 0n;

		this.TimeShift =
			BigInt(config.SequenceBytes || 15) + BigInt(config.WorkerIdBytes || 6) + BigInt(config.ProcessIdBytes || 7);

		this.WorkerIdProcessId =
			(BigInt(config.WorkerId || 1) << BigInt(config.SequenceBytes || 15)) |
			(BigInt(config.ProcessId || 0) << (BigInt(config.SequenceBytes || 15) + BigInt(config.WorkerIdBytes || 6)));
	}

	public Generate(): string {
		const timestamp = BigInt(Date.now()) - this.Epoch;
		const snowflake = (timestamp << this.TimeShift) | this.WorkerIdProcessId | this.Increment;
		this.Increment = (this.Increment + 1n) & ((1n << BigInt(this.TimeShift)) - 1n);

		return snowflake.toString();
	}

	public MassGenerate(amount = 5): string[] {
		const snowflakes = [];

		for (let index = 0; index < amount; index++) {
			snowflakes.push(this.Generate());
		}

		return snowflakes;
	}

	public TimeStamp(snowflake: string): number {
		return Number((BigInt(snowflake) >> this.TimeShift) + this.Epoch);
	}

	public Validate(snowflake: string): boolean {
		const bigintSnowflake = BigInt(snowflake);
		const timestamp = (bigintSnowflake >> this.TimeShift) + this.Epoch;
		const currentTimestamp = BigInt(Date.now());

		if (snowflake.length <= 12) return false; // snowflakes are 17-19 digits long (Depending on the age)

		// Check if the timestamp is within a valid range (adjust these values as needed)
		const maxTimestamp = currentTimestamp + (1n << this.TimeShift) - 1n;
		if (timestamp < this.Epoch || timestamp > maxTimestamp) {
			return false;
		}

		// Check if the timestamp is not in the future
		if (timestamp > currentTimestamp) {
			return false;
		}

		// Check if the snowflake is not within the first few increments
		return (bigintSnowflake & ((1n << this.TimeShift) - 1n)) !== 0n;
	}
}

export default Snowflake;

export { Snowflake };
