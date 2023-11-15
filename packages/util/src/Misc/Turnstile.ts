/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { URLSearchParams } from "node:url";
import { request } from "undici";
import type { TurnstileValidationResponse } from "../types/Turnstile";
import IpUtils from "./IpUtils.js";

class Turnstile {
	private readonly Enabled: boolean;

	private readonly Secret: string | null;

	private readonly VerifyURL: string;

	public constructor(CaptchaEnabled: boolean, TurnstileSecret: string) {
		this.Enabled = CaptchaEnabled;

		this.Secret = TurnstileSecret;

		this.VerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
	}

	public async Verify(response: string, ip?: string): Promise<TurnstileValidationResponse> {
		if (!this.Enabled)
			return {
				success: true,
			};

		if (!this.Secret)
			return {
				success: false,
				"error-codes": ["internal-error"],
			}; // if captcha is enabled but no secret is provided then return false

		const FormData = new URLSearchParams();

		FormData.append("secret", this.Secret);
		FormData.append("response", response);

		if (ip && !IpUtils.IsLocalIp(ip)) FormData.append("remoteip", ip);

		const { body } = await request(this.VerifyURL, {
			method: "POST",
			body: FormData.toString(),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		return (await body.json()) as TurnstileValidationResponse;
	}
}

export default Turnstile;

export { Turnstile };
