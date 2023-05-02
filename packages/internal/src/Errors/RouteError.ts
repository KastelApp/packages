class RouteError extends Error {
	public constructor(message: string) {
		super(message);

		this.name = 'RouteError';
	}
}

export default RouteError;

export { RouteError };
