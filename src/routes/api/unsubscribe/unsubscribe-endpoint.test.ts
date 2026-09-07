import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyTurnstile = vi.fn(async () => true);
vi.mock('$lib/server/turnstile', () => ({ verifyTurnstile }));

const { GET, POST } = await import('./+server');

function kv(existing: string | null = null) {
	return {
		get: vi.fn(async () => existing),
		put: vi.fn(async () => undefined),
		delete: vi.fn(async () => undefined)
	};
}

function event(
	url: string,
	options: { kv?: ReturnType<typeof kv> | null; body?: string } = {}
) {
	const store = options.kv === null ? undefined : (options.kv ?? kv());
	return {
		store,
		event: {
			url: new URL(url),
			request: new Request(url, { method: 'POST', body: options.body }),
			platform: {
				env: {
					...(store ? { SUBSCRIBERS: store } : {}),
					TURNSTILE_SECRET_KEY: 'turnstile-secret'
				}
			}
		} as unknown as Parameters<typeof POST>[0]
	};
}

async function redirectOf(e: Parameters<typeof GET>[0]) {
	return GET(e);
}

beforeEach(() => {
	verifyTurnstile.mockClear();
	verifyTurnstile.mockResolvedValue(true);
});

describe('POST /api/unsubscribe with a token', () => {
	it('writes a one-click marker and answers 200 with an HTML page', async () => {
		const { event: e, store } = event(
			'https://gregory.sh/api/unsubscribe?token=abc.def-123',
			{ body: 'List-Unsubscribe=One-Click' }
		);

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		const body = await response.text();
		expect(body).toContain('being removed');

		expect(store?.put).toHaveBeenCalledTimes(1);
		const [key, value, opts] = (store?.put as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(key).toBe('unsub:abc.def-123');
		expect(opts).toEqual({ expirationTtl: 60 * 60 * 24 * 30 });
		const marker = JSON.parse(value as string);
		expect(marker.via).toBe('one-click');
		expect(new Date(marker.requestedAt).toString()).not.toBe('Invalid Date');

		expect(store?.delete).not.toHaveBeenCalled();
	});

	it('writes a confirm marker for an empty body', async () => {
		const { event: e, store } = event(
			'https://gregory.sh/api/unsubscribe?token=abc.def-123'
		);

		const response = await POST(e);

		expect(response.status).toBe(200);
		const [, value] = (store?.put as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(JSON.parse(value as string).via).toBe('confirm');
	});

	it('rejects an empty token', async () => {
		const { event: e, store } = event('https://gregory.sh/api/unsubscribe?token=');

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store?.put).not.toHaveBeenCalled();
	});

	it('rejects a token with characters outside the allowed set', async () => {
		const { event: e, store } = event(
			'https://gregory.sh/api/unsubscribe?token=abc%20def'
		);

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store?.put).not.toHaveBeenCalled();
	});

	it('rejects a token over 512 characters', async () => {
		const longToken = 'a'.repeat(513);
		const { event: e, store } = event(
			`https://gregory.sh/api/unsubscribe?token=${longToken}`
		);

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store?.put).not.toHaveBeenCalled();
	});

	it('answers 503 when the KV binding is missing', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			kv: null
		});

		const response = await POST(e);

		expect(response.status).toBe(503);
	});
});

describe('POST /api/unsubscribe with a JSON body', () => {
	it('removes an address that is subscribed once Turnstile passes', async () => {
		const store = kv(JSON.stringify({ joinedAt: '2026-01-01T00:00:00.000Z' }));
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'Sam@Example.com', turnstileToken: 'tok' })
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(verifyTurnstile).toHaveBeenCalledTimes(1);
		expect(store.delete).toHaveBeenCalledWith('sam@example.com');
		expect(store.put).not.toHaveBeenCalled();
	});

	it('answers the same for an address that is not subscribed', async () => {
		const store = kv(null);
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Unsubscribed successfully' });
		expect(store.delete).not.toHaveBeenCalled();
	});

	it('rejects a failed Turnstile check', async () => {
		verifyTurnstile.mockResolvedValue(false);
		const store = kv(JSON.stringify({ joinedAt: '2026-01-01T00:00:00.000Z' }));
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store.delete).not.toHaveBeenCalled();
	});

	it('rejects an invalid address', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'not-an-email' })
		});

		const response = await POST(e);

		expect(response.status).toBe(400);
	});

	it('answers 503 when the KV binding is missing', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: null,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		const response = await POST(e);

		expect(response.status).toBe(503);
	});
});

describe('GET /api/unsubscribe', () => {
	it('sends a token on to the human page', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc.def');

		const response = await redirectOf(e);

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/unsubscribe?token=abc.def');
	});

	it('sends a link with no token to the plain page', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe');

		const response = await redirectOf(e);

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/unsubscribe');
	});
});
