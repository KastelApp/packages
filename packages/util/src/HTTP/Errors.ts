class HTTPErrors {
	public Code: number;

	public Errors: { [key: string]: any };

	public constructor(code: number, ...errors: any[]) {
		this.Code = code;
		this.Errors = {};

		for (const error of errors) {
			this.AddError(error);
		}
	}

	public AddError(error: { [key: string]: any }): void {
		for (const [key, value] of Object.entries(error)) {
			if (Array.isArray(value)) {
				for (const [index, item] of value.entries()) {
					if (this.Errors[key]) {
						this.Errors[key][index] = item;
					} else {
						this.Errors[key] = { [index]: item };
					}
				}
			} else {
				this.Errors[key] = value;
			}
		}
	}

	public AddToError(errorName: string, error: { [key: string]: any }): void {
		for (const [, value] of Object.entries(error)) {
			if (Array.isArray(value)) {
				for (const [index, item] of value.entries()) {
					if (this.Errors[errorName]) {
						this.Errors[errorName][index] = item;
					} else {
						this.Errors[errorName] = { [index]: item };
					}
				}
			} else {
				for (const [keyf, valuef] of Object.entries(value)) {
					if (this.Errors[errorName]) {
						const index = Object.keys(this.Errors[errorName]).length;
						this.Errors[errorName][index] = { [keyf]: valuef };
					} else {
						this.Errors[errorName] = {
							0: { [keyf]: valuef },
						};
					}
				}
			}
		}
	}

	public toJSON(): { code: number; errors: { [key: string]: any } } {
		return {
			code: this.Code,
			errors: this.Errors,
		};
	}

	public toString(): string {
		return JSON.stringify(this.toJSON());
	}

	public ClearErrors(): void {
		this.Errors = {};
	}

	public ClearError(errorName: string): void {
		this.Errors = Object.fromEntries(Object.entries(this.Errors).filter(([key]) => key !== errorName));
	}
}

export default HTTPErrors;

export { HTTPErrors };
