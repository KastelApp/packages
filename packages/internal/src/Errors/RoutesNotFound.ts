class RoutesNotFound extends Error {
	public constructor(message: string) {
		super(message);

		this.name = 'RoutesNotFound';
	}
}

export default RoutesNotFound;

export { RoutesNotFound };
