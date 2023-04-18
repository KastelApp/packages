export interface SnowConfig {
	Epoch: number;
	ProcessId: number;
	ProcessIdBytes: number;
	SequenceBytes: number;
	WorkerId: number;
	WorkerIdBytes: number;
}

export interface SnowflakeSettings {
	Epoch: bigint;
	Increment: bigint;
	TimeShift: bigint;
	WorkerIdProcessId: bigint;
	epoch: bigint;
	increment: bigint;
	timeShift: bigint;
}
