class BaseStore<Key, Value> extends Map<Key, Value> {
	/**
	 * Returns an array of all the keys in the store.
	 */
	public array(): Value[] {
		return Array.from(this.values());
	}

	public keyArray(): Key[] {
		return Array.from(this.keys());
	}

	public last(): Value | undefined {
		return this.array()[this.array().length - 1];
	}

	public first(): Value | undefined {
		return this.array()[0];
	}

	public wipe(): void {
		for (const item of this.keyArray()) {
			this.delete(item);
		}
	}
}

export { BaseStore };

export default BaseStore;
