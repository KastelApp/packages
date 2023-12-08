class StringFormatter {
	public static colors = {
		reset: '\u001B[0m',
		purple: '\u001B[35m',
		orange: '\u001B[33m',
		green: '\u001B[32m',
		red: '\u001B[31m',
		blue: '\u001B[34m',
		yellow: '\u001B[33m',
		cyan: '\u001B[36m',
		white: '\u001B[37m',
	};

	public static purple(str: string): string {
		return `${this.colors.purple}${str}${this.colors.reset}`;
	}

	public static orange(str: string): string {
		return `${this.colors.orange}${str}${this.colors.reset}`;
	}

	public static green(str: string): string {
		return `${this.colors.green}${str}${this.colors.reset}`;
	}

	public static red(str: string): string {
		return `${this.colors.red}${str}${this.colors.reset}`;
	}

	public static blue(str: string): string {
		return `${this.colors.blue}${str}${this.colors.reset}`;
	}

	public static yellow(str: string): string {
		return `${this.colors.yellow}${str}${this.colors.reset}`;
	}

	public static cyan(str: string): string {
		return `${this.colors.cyan}${str}${this.colors.reset}`;
	}

	public static white(str: string): string {
		return `${this.colors.white}${str}${this.colors.reset}`;
	}
}

export default StringFormatter;

export { StringFormatter };
