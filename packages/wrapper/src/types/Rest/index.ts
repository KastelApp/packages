export interface ResponseBody {
	Code?: number;
	Errors?: {
		[key: string]: {
			Code: string;
			Message: string;
		};
	};
}

export interface RequestInit {
	body?: any;
	headers?: Record<string, string>;
	noApi?: boolean;
	userAgent?: string;
}
