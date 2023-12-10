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
	ProcessIdBytes: 1,
	SequenceBytes: 6,
	WorkerId: 5,
	WorkerIdBytes: 12,
});

const GeneratedSnowflake = SnowflakeGen.Generate();

console.log(GeneratedSnowflake); // 21443134786896192

const HTTPError = new HTTPErrors(4000, {
	Code: {
		message: 'Invalid Code',
		status: 400,
	},
});

HTTPError.AddError({
	Waffles: {
		message: 'Invalid Waffles',
		status: 400,
	},
});

console.log(HTTPError.toJSON()); // { Code: 4000, Errors: { Code: { Message: 'Invalid Code', Status: 400 }, Waffles: { Message: 'Invalid Waffles', Status: 400 } }
```
