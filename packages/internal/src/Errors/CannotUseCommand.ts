class CannotUseCommand extends Error {
	public constructor(message: string) {
		super(message);

		this.name = 'CannotUseCommand';
	}
}

export default CannotUseCommand;

export { CannotUseCommand };
