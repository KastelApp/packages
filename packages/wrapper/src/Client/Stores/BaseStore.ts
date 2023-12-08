class BaseStore<Key, Value> extends Map<Key, Value> {
	private subscribers: ((value: Value, type: 'A' | 'R', key: Key) => void)[] = [];

	public subscribe(cb: (value: Value, type: 'A' | 'R', key: Key) => void): void {
		this.subscribers.push(cb);
	}

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
			for (const subscriber of this.subscribers) {
				subscriber(this.get(item) as Value, 'R', item);
			}

			this.delete(item);
		}
	}

	public override set(key: Key, value: Value): this {
		super.set(key, value);

		for (const subscriber of this.subscribers) {
			subscriber(value, 'A', key);
		}

		return this;
	}

	public override delete(key: Key): boolean {
		const value = this.get(key);

		if (value) {
			for (const subscriber of this.subscribers) {
				subscriber(value, 'R', key);
			}
		}

		return super.delete(key);
	}
}

export { BaseStore };

export default BaseStore;
