// 'GET', 'POST', 'DELETE', 'PATCH', 'PUT' these are all the methods the api supports for now

import type { RequestInit } from '../types/Rest';

class Rest {
	private Token: string | null;

	private readonly DefaultUserAgent: string;

	public Version: string;

	public Url: string;

	public Api: string;

	public constructor(token?: string) {
		this.Token = token ?? '';

		this.DefaultUserAgent = window.navigator.userAgent;

		this.Version = 'v1';

		this.Url = 'http://localhost:62250';

		this.Api = `${this.Url}/${this.Version}`;
	}

	public setToken(token: string | null) {
		this.Token = token;

		return this;
	}

	public setVersion(version: string) {
		this.Version = version;

		this.Api = `${this.Url.endsWith('/') ? this.Url.slice(0, -1) : this.Url}/${this.Version}`;

		return this;
	}

	public setUrl(url: string) {
		this.Url = url.startsWith('http') ? url : `http://${url}`;

		this.Api = `${this.Url.endsWith('/') ? this.Url.slice(0, -1) : this.Url}/${this.Version}`;

		return this;
	}

	public async fetch<T = any>(
		method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
		endpoint: string,
		options?: RequestInit,
	): Promise<{
		headers: Headers | null;
		json: T;
		statusCode: number;
		text: string;
	}> {
		return new Promise((resolve) => {
			const Headers: any = options?.headers ?? {};

			if (options?.body) {
				if (options?.body instanceof FormData) {
					Headers['Content-Type'] = 'multipart/form-data';
				} else {
					Headers['Content-Type'] = 'application/json';
				}
			}

			if (this.Token) {
				Headers.Authorization = `${this.Token}`;
			}

			Headers['User-Agent'] = options?.userAgent ?? this.DefaultUserAgent;

			const url = options?.noApi ? this.ApiUrlWithNoVersion : this.Api;

			void fetch(`${url}${endpoint}`, {
				method,
				headers: Headers,
				...(options?.body
					? { body: options?.body instanceof FormData ? options?.body : JSON.stringify(options?.body) }
					: {}),
			})
				.catch((error) => {
					console.log('Failed to fetch...?', error);

					resolve({
						statusCode: 500,
						text: '',
						headers: null,
						json: null as any,
					});
				})
				.then(async (res) => {
					if (res) {
						const headers = res.headers;
						const text = await res.text();

						const ShouldParse =
							headers.has('content-type') && headers.get('content-type')?.includes('application/json');

						resolve({
							statusCode: res.status,
							text,
							headers,
							json: ShouldParse ? JSON.parse(text) : null,
						});
					}
				});
		});
	}

	private get ApiUrlWithNoVersion() {
		return this.Api.replace(`/${this.Version}`, '');
	}

	public async get<T = any>(endpoint: string, options?: RequestInit) {
		return this.fetch<T>('GET', endpoint, options);
	}

	public async post<T = any>(endpoint: string, options?: RequestInit) {
		return this.fetch<T>('POST', endpoint, options);
	}

	public async delete<T = any>(endpoint: string, options?: RequestInit) {
		return this.fetch<T>('DELETE', endpoint, options);
	}

	public async patch<T = any>(endpoint: string, options?: RequestInit) {
		return this.fetch<T>('PATCH', endpoint, options);
	}

	public async put<T = any>(endpoint: string, options?: RequestInit) {
		return this.fetch<T>('PUT', endpoint, options);
	}
}

export default Rest;

export { Rest };
