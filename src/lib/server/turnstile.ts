const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_MAX_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 10_000;

interface TurnstileResponse {
	success?: boolean;
	action?: string;
	hostname?: string;
}

interface VerifyTurnstileOptions {
	token: unknown;
	secret: string;
	action: string;
	allowedHostnames: readonly string[];
	remoteIp?: string | null;
}

export async function verifyTurnstile({
	token,
	secret,
	action,
	allowedHostnames,
	remoteIp
}: VerifyTurnstileOptions): Promise<boolean> {
	if (
		typeof token !== 'string' ||
		token.length === 0 ||
		token.length > TOKEN_MAX_LENGTH ||
		secret.length === 0 ||
		allowedHostnames.length === 0
	) {
		return false;
	}

	const body = new URLSearchParams({ secret, response: token });
	if (remoteIp) body.set('remoteip', remoteIp);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
			signal: controller.signal
		});

		if (!response.ok) return false;

		const result = (await response.json()) as TurnstileResponse;
		return (
			result.success === true &&
			result.action === action &&
			typeof result.hostname === 'string' &&
			allowedHostnames.includes(result.hostname)
		);
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
}
