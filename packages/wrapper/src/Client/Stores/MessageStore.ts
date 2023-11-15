import type Client from "../Client";
import type Message from "../Structures/Channels/Message";
import BaseStore from "./BaseStore.js";

/**
 * A store for Messages.
 */
class MessageStore {
	private readonly client: Client;

	public messages: BaseStore<string, Message> = new BaseStore();

	public constructor(client: Client) {
		this.client = client;

		if (this.client) {
			//
		}
	}

	public get(id: string): Message | undefined {
		return this.messages.get(id);
	}

	public set(id: string, value: Message): this {
		this.messages.set(id, value);

		return this;
	}

	public clear(): void {
		this.messages.clear();
	}
}

export { MessageStore };

export default MessageStore;
