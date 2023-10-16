import { type Writable, writable } from 'svelte/store';
import type Client from '../Client';
import BaseChannel from '../Structures/Channels/BaseChannel.js';
import BaseStore from './BaseStore.js';

/**
 * A store for Channels.
 */
class ChannelStore {
	public channelStore: Writable<BaseStore<string, BaseChannel>>;

	private readonly client: Client;

	private _currentChannel: string | null;

	public channels: BaseStore<string, BaseChannel> = new BaseStore();

	public constructor(client: Client) {
		this.channelStore = writable(new BaseStore<string, BaseChannel>());

		this.client = client;

		if (this.client) {
			//
		}

		this._currentChannel = null;

		this.channelStore.subscribe((value) => {
			this.channels = value;
		});
	}

	public get(id: string): BaseChannel | undefined {
		return this.channels.get(id);
	}

	public set(id: string, value: BaseChannel): this {
		this.channels.set(id, value);
		this.channelStore.set(this.channels);

		return this;
	}

	public get currentChannel(): BaseChannel | undefined {
		return this.channels.get(this._currentChannel ?? '');
	}

	public setCurrentChannel(value: BaseChannel | string | undefined) {
		if (value instanceof BaseChannel) {
			this._currentChannel = value.id;
		} else if (typeof value === 'string') {
			this._currentChannel = value;
		} else {
			this._currentChannel = null;
		}
	}

	public filter(fn: (value: BaseChannel, index: number, array: BaseChannel[]) => unknown): BaseChannel[] {
		return this.channels.array().filter(fn);
	}

	public clear(): void {
		this.channels.clear();
		this.channelStore.set(this.channels);
	}
}

export { ChannelStore };

export default ChannelStore;
