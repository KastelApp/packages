import { type Writable, writable } from 'svelte/store';
import type Client from '../Client';
import type Message from '../Structures/Channels/Message';
import BaseStore from './BaseStore.js';

/**
 * A store for Messages.
 */
class MessageStore {
	public messageStore: Writable<BaseStore<string, Message>>;

	private readonly client: Client;

	public messages: BaseStore<string, Message> = new BaseStore();

	public constructor(client: Client) {
		this.messageStore = writable(new BaseStore<string, Message>());

		this.client = client;

		if (this.client) {
			//
		}

		this.messageStore.subscribe((value) => {
			this.messages = value;
		});
	}

	public get(id: string): Message | undefined {
		return this.messages.get(id);
	}

	public set(id: string, value: Message): this {
		this.messages.set(id, value);
		this.messageStore.set(this.messages);

		return this;
	}

	public clear(): void {
		this.messages.clear();
		this.messageStore.set(this.messages);
	}
}

export { MessageStore };

export default MessageStore;
