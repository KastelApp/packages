export interface SnowConfig {
	Epoch: bigint;
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
}
