import type * as Client from './Client/index';
import type * as Misc from './Misc/index';
import type * as Payloads from './Websocket/Payloads/Auth';

// export a var name "Types" with all the types above
export interface Types {
	Client: typeof Client;
	Misc: typeof Misc;
	Payloads: typeof Payloads;
}
