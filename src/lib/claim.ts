/** Path of the page where rewards are claimed. Peanut's own claim page no longer opens SDK links. */
export const CLAIM_PATH = '/claim';

// The password of a reward link lives in the URL fragment (`#p=…`). Whoever knows it can claim the
// funds, so it must never reach analytics or error reports.
const SECRET_RE = /([#&?]p=)[^&\s"'\\]+/g;

export function redactClaimSecret(value: string): string {
	return value.replace(SECRET_RE, '$1[redacted]');
}

/** Redacts claim secrets from every string of a JSON-serializable value, e.g. a Sentry event. */
export function redactClaimSecrets<T>(value: T): T {
	return JSON.parse(redactClaimSecret(JSON.stringify(value)));
}
