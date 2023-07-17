export type Encoding = 'json';

export type ConnectionType = 'client' | 'system';

export type Status =
	| 'Connected'
	| 'Connecting'
	| 'Disconnected'
	| 'Failed'
	| 'Ready'
	| 'Reconnecting'
	| 'ReconnectingResumeable';

export interface WebsocketSettings {
	Compress: boolean;
	// only json is supported for now
	Encoding: Encoding;
	Url: string;
	Version: string;
}

export interface AuthlessRoute {
	path: RegExp | string;
	redirect?: string;
	type: 'Auth' | 'NoAuth' | 'RedirectOnAuth';
}
