/**
 * See {@link https://github.com/marsidev/react-turnstile/blob/main/packages/example/src/types.d.ts} for source
 */

export interface TurnstileValidationResponse {
	/**
	 * The customer widget identifier passed to the widget on the client side. This is used to differentiate widgets using the same sitekey in analytics. Its integrity is protected by modifications from an attacker. It is recommended to validate that the action matches an expected value.
	 */
	action?: string;
	/**
	 * The customer data passed to the widget on the client side. This can be used by the customer to convey state. It is integrity protected by modifications from an attacker.
	 */
	cdata?: string;
	/**
	 * The ISO timestamp for the time the challenge was solved.
	 */
	challenge_ts?: string;
	/**
	 * A list of errors that occurred.
	 */
	'error-codes'?: TurnstileValidationErrorCode[];
	/**
	 * The hostname for which the challenge was served.
	 */
	hostname?: string;
	/**
	 * Indicate if the token validation was successful or not.
	 */
	success: boolean;
}

export type TurnstileValidationErrorCode =
	/**
	 * The request was rejected because it was malformed.
	 */
	| 'bad-request'
	/**
	 * An internal error happened while validating the response. The request can be retried.
	 */
	| 'internal-error'
	/**
	 * The response parameter is invalid or has expired.
	 */
	| 'invalid-input-response'
	/**
	 * The secret parameter was invalid or did not exist.
	 */
	| 'invalid-input-secret'
	/**
	 * The response parameter was not passed.
	 */
	| 'missing-input-response'
	/**
	 * The secret parameter was not passed.
	 */
	| 'missing-input-secret'
	/**
	 * The response parameter has already been validated before.
	 */
	| 'timeout-or-duplicate';
