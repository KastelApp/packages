class HTTPErrors {
    code: number;
    errors: { [key: string]: any };

    constructor(code: number, ...errors: any[]) {
        this.code = code;
        this.errors = {};

        for (const error of errors) {
            this.addError(error);
        }
    }

    addError(error: { [key: string]: any }): void {
        Object.entries(error).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (this.errors[key]) {
                        this.errors[key][index] = item;
                    } else {
                        this.errors[key] = { [index]: item };
                    }
                });
            } else {
                this.errors[key] = value;
            }
        });
    }

    addToError(errorName: string, error: { [key: string]: any }): void {
        Object.entries(error).forEach(([, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (this.errors[errorName]) {
                        this.errors[errorName][index] = item;
                    } else {
                        this.errors[errorName] = { [index]: item };
                    }
                });
            } else {
                Object.entries(value).forEach(([keyf, valuef]) => {
                    if (this.errors[errorName]) {
                        const index = Object.keys(this.errors[errorName]).length;
                        this.errors[errorName][index] = { [keyf]: valuef };
                    } else {
                        this.errors[errorName] = {
                            0: { [keyf]: valuef },
                        };
                    }
                });
            }
        });
    }

    toJSON(): { code: number; errors: { [key: string]: any } } {
        return {
            code: this.code,
            errors: this.errors,
        };
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    clearErrors(): void {
        this.errors = {};
    }

    clearError(errorName: string): void {
        delete this.errors[errorName];
    }
}

export default HTTPErrors;

export { HTTPErrors };