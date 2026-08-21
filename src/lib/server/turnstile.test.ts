import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

const options = {
	token: 'valid-token',
	secret: 'secret',
	action: 'newsletter_subscribe',
	allowedHostnames: ['gregory.sh']
};

afterEach(() => vi.unstubAllGlobals());

describe('verifyTurnstile', () => {
	it('accepts a matching successful response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						success: true,
						action: options.action,
						hostname: 'gregory.sh'
					}),
					{ status: 200 }
				)
			)
		);

		await expect(verifyTurnstile(options)).resolves.toBe(true);
	});

	it('rejects a different action', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						success: true,
						action: 'newsletter_unsubscribe',
						hostname: 'gregory.sh'
					})
				)
			)
		);

		await expect(verifyTurnstile(options)).resolves.toBe(false);
	});

	it('rejects a different hostname', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						success: true,
						action: options.action,
						hostname: 'attacker.example'
					})
				)
			)
		);

		await expect(verifyTurnstile(options)).resolves.toBe(false);
	});

	it('fails closed when verification cannot be reached', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

		await expect(verifyTurnstile(options)).resolves.toBe(false);
	});

	it('rejects a spent token response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ success: false, 'error-codes': ['timeout-or-duplicate'] }))
			)
		);

		await expect(verifyTurnstile(options)).resolves.toBe(false);
	});
});
