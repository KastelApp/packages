import { MessageStates } from '../../../Utils/Constants';
import type Client from '../../Client';

class Message {
	private readonly client: Client;

	public id: string;

	public channelId: string;

	public state: MessageStates;

	public constructor(client: Client, message: Message, channelId: string) {
		this.client = client;

		this.id = message.id;

		this.channelId = channelId;

		this.state = MessageStates.Sent; // we default to sent
	}

	public setState(state: MessageStates): this {
		this.state = state;

		return this;
	}

	public reply() {
		if (this.client) {
		}
	}
}

export default Message;

export { Message };
