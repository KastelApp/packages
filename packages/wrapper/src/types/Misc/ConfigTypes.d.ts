export type Encoding = 'json';

export type ConnectionType = 'client' | 'system';

export type Status = 'connecting' | 'disconnected' | 'ready' | 'reconnecting';

export interface WebsocketSettings {
	Compress: boolean;
	// only json is supported for now
	Encoding: Encoding;
	Url: string;
	Version: string;
}
