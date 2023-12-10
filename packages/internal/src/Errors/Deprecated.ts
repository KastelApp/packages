class DeprecatedError extends Error {
	public constructor(message: string) {
		super(message);

		this.name = 'DeprecatedError';
	}

	public static warning(message: string): void {
		console.warn(`[Deprecated] ${message}`);
	}
}

export default DeprecatedError;

export { DeprecatedError };
