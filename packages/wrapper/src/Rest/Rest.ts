// 'GET', 'POST', 'DELETE', 'PATCH', 'PUT' these are all the methods the api supports for now

import type { RequestInit } from '../types/Rest';

class Rest {
	private Token: string;

	private readonly DefaultUserAgent: string;

	public Version: string;

	public Url: string;

	public Api: string;

	public constructor(token?: string) {
		this.Token = token ?? '';

		this.DefaultUserAgent = window.navigator.userAgent;

		this.Version = 'v1';

		this.Url = `https://api.kastelapp.com/`;

		this.Api = `${this.Url}${this.Version}`;
	}

	public setToken(token: string) {
		this.Token = token;

		return this;
	}

	public setVersion(version: string) {
		this.Version = version;

		this.Api = `${this.Url}${this.Version}`;

		return this;
	}

	public setUrl(url: string) {
		this.Url = url;

		this.Api = `${this.Url}${this.Version}`;

		return this;
	}

	public async fetch<T>(
		method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
		endpoint: string,
		options?: RequestInit,
	): Promise<T> {
		const Request = await fetch(`${this.Api}/${endpoint}`, {
			method,
			headers: {
				'Content-Type': options?.body
					? options?.body instanceof FormData
						? 'multipart/form-data'
						: 'application/json'
					: 'application/x-www-form-urlencoded',
				Authorization: `${this.Token}`,
				'User-Agent': options?.userAgent ?? this.DefaultUserAgent,
				...options?.headers,
			},
			...(options?.body
				? { body: options?.body instanceof FormData ? options?.body : JSON.stringify(options?.body) }
				: {}),
		});

		const Text = await Request.text(); // we make it text so we can then check if its json or not etc etc

		try {
			return JSON.parse(Text);
		} catch {
			return Text as unknown as T;
		}
	}

	public async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.fetch<T>('GET', endpoint, options);
	}

	public async post<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.fetch<T>('POST', endpoint, options);
	}

	public async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.fetch<T>('DELETE', endpoint, options);
	}

	public async patch<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.fetch<T>('PATCH', endpoint, options);
	}

	public async put<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.fetch<T>('PUT', endpoint, options);
	}
}

export default Rest;

export { Rest };
