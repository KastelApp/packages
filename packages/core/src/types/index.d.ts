import type ws from 'ws';

declare module 'ws' {
	export interface WebSocket extends ws {
		id: string;
	}
}
