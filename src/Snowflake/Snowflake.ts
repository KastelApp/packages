interface snowConfig {
  epoch: number;
  workerId: number;
  datacenterId: number;
  workerId_Bytes: number;
  datacenterId_Bytes: number;
  sequence_Bytes: number;
}

let snow: snowConfig = {
  epoch: 1641016800000,
  workerId: 1,
  datacenterId: 1,
  workerId_Bytes: 6,
  datacenterId_Bytes: 5,
  sequence_Bytes: 12,
};

// interface SnowflakeSettingsData {
//     epoch: bigint;
//     start: bigint;
//     increment: bigint;
//     workerId: bigint;
//     sequenceMask: bigint;
//     datacenterId: bigint;
//     workerShift: bigint;
//     dataCenterShift: bigint;
//     timeShift: bigint;
// }

interface SnowflakeSettings {
  epoch: bigint;
  increment: bigint;
  timeShift: bigint;
  workerId_DataCenterId: bigint;
}

const settings: SnowflakeSettings = {
  epoch: BigInt(new Date(Number(snow.epoch || 1641016800000)).getTime()),
  increment: 0n,
  timeShift:
    BigInt(snow.sequence_Bytes || 15) + BigInt(snow.workerId_Bytes || 6) + BigInt(snow.datacenterId_Bytes || 7),
  workerId_DataCenterId:
    (BigInt(snow.workerId || 1) << BigInt(snow.sequence_Bytes || 15)) |
    (BigInt(snow.datacenterId || 0) << (BigInt(snow.sequence_Bytes || 15) + BigInt(snow.workerId_Bytes || 6))),
};

export default class Snowflake {
  static generate(timestamp: number | Date = Date.now()): string {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      throw new TypeError(
        `'timestamp' expected to be number but got ${isNaN(timestamp as number) ? 'NaN' : typeof timestamp}`,
      );
    }

    const timeShift = BigInt(BigInt(timestamp) - settings.epoch) << settings.timeShift;

    if (settings.increment >= 4095n) settings.increment = 0n;

    return (timeShift | settings.workerId_DataCenterId | settings.increment++).toString();
  }

  static massGenerate(amount = 5): string[] {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new TypeError(`'amount' expected to be number but got ${isNaN(amount) ? 'NaN' : typeof amount}`);
    }

    const ids = [];

    for (let i = 0; i < Number(amount); i++) {
      ids.push(Snowflake.generate());
    }

    return ids;
  }

  static get settings(): SnowflakeSettings {
    return settings;
  }

  static timeStamp(snowflake: string): number {
    return Number((BigInt(snowflake) >> settings.timeShift) + settings.epoch);
  }

  static validate(snowflake: string): boolean {
    if (typeof snowflake !== 'string') {
      throw new TypeError(`'snowflake' expected to be string but got ${typeof snowflake}`);
    }

    const length = /^\d{17,21}$/.test(snowflake);

    if (!length) return false;

    const timestamp = Snowflake.timeStamp(snowflake);

    if (timestamp < Number(settings.epoch)) return false;

    if (timestamp > Date.now()) return false;

    return true;
  }

  static setConfig(conf: snowConfig): 'OK' {
    snow = conf;

    return 'OK';
  }
}
