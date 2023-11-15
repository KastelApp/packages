import BaseChannel from "./BaseChannel.js";

class TextChannel extends BaseChannel {
	public setParent(parentId: string) {
		if (parentId) {
			//
		}

		return this;
	}
}

export default TextChannel;
