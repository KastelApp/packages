class HTTPErrors {
	public code: number;

	public errors: { [key: string]: any };

	public constructor(code: number, ...errors: any[]) {
		this.code = code;
		this.errors = {};

		for (const error of errors) {
			this.addError(error);
		}
	}

	public addError(error: { [key: string]: any }): void {
		for (const [key, value] of Object.entries(error)) {
			if (Array.isArray(value)) {
				for (const [index, item] of value.entries()) {
					if (this.errors[key]) {
						this.errors[key][index] = item;
					} else {
						this.errors[key] = { [index]: item };
					}
				}
			} else {
				this.errors[key] = value;
			}
		}
	}

	public addToError(errorName: string, error: { [key: string]: any }): void {
		for (const [, value] of Object.entries(error)) {
			if (Array.isArray(value)) {
				for (const [index, item] of value.entries()) {
					if (this.errors[errorName]) {
						this.errors[errorName][index] = item;
					} else {
						this.errors[errorName] = { [index]: item };
					}
				}
			} else {
				for (const [keyf, valuef] of Object.entries(value)) {
					if (this.errors[errorName]) {
						const index = Object.keys(this.errors[errorName]).length;
						this.errors[errorName][index] = { [keyf]: valuef };
					} else {
						this.errors[errorName] = {
							0: { [keyf]: valuef },
						};
					}
				}
			}
		}
	}

	public toJSON(): { code: number; errors: { [key: string]: any } } {
		return {
			code: this.code,
			errors: this.errors,
		};
	}

	public toString(): string {
		return JSON.stringify(this.toJSON());
	}

	public clearErrors(): void {
		this.errors = {};
	}

	public clearError(errorName: string): void {
		this.errors = Object.fromEntries(Object.entries(this.errors).filter(([key]) => key !== errorName));
	}
}

export default HTTPErrors;

export { HTTPErrors };
