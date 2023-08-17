export interface RequestInit<T = any> {
	body?: T;
	headers?: Record<string, string>;
	userAgent?: string;
}
