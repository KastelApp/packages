# @Kastelll/Util

## Installation

```bash
yarn add @kastelll/util
```

or

```bash
npm install @kastelll/util
```

## Usage

```js
import { Snowflake, HTTPErrors } from '@kastelll/util';

const SnowflakeGen = new Snowflake({
	Epoch: 1_641_016_800_000,
	ProcessId: process.pid,
	ProcessIdBytes: 2,
	SequenceBytes: 2,
	WorkerId: 1,
	WorkerIdBytes: 2,
});

const GeneratedSnowflake = SnowflakeGen.generate();

console.log(GeneratedSnowflake); // 536277067310956565

const HTTPError = new HTTPErrors(4000, {
	Code: {
		message: 'Invalid Code',
		status: 400,
	},
});

HTTPError.addError({
	Waffles: {
		message: 'Invalid Waffles',
		status: 400,
	},
});

console.log(HTTPError.toObject()); // { Code: { message: 'Invalid Code', status: 400 }, Waffles: { message: 'Invalid Waffles', status: 400 } }
```
