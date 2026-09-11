const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_MAX_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 10_000;
interface TurnstileResponse { success?: boolean; action?: string; hostname?: string; }
export interface VerifyTurnstileOptions { token: unknown; secret: string; action: string; allowedHostnames: readonly string[]; remoteIp?: string | null; }
export type TurnstileResult = { accepted: boolean; available: boolean; attempted: boolean };
export function hasValidTurnstileInput(options: VerifyTurnstileOptions) { return typeof options.token === 'string' && options.token.length > 0 && options.token.length <= TOKEN_MAX_LENGTH && options.secret.length > 0 && options.allowedHostnames.length > 0; }
export async function verifyTurnstileResult(options: VerifyTurnstileOptions): Promise<TurnstileResult> {
	if (!hasValidTurnstileInput(options)) return { accepted: false, available: true, attempted: false };
	const body = new URLSearchParams({ secret: options.secret, response: options.token as string });
	if (options.remoteIp) body.set('remoteip', options.remoteIp);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
	try {
		const response = await fetch(SITEVERIFY_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: controller.signal });
		if (!response.ok) return { accepted: false, available: false, attempted: true };
		const result = (await response.json()) as TurnstileResponse;
		if (typeof result.success !== 'boolean') return { accepted: false, available: false, attempted: true };
		return { accepted: result.success === true && result.action === options.action && typeof result.hostname === 'string' && options.allowedHostnames.includes(result.hostname), available: true, attempted: true };
	} catch { return { accepted: false, available: false, attempted: true }; } finally { clearTimeout(timeout); }
}
export async function verifyTurnstile(options: VerifyTurnstileOptions): Promise<boolean> { return (await verifyTurnstileResult(options)).accepted; }
