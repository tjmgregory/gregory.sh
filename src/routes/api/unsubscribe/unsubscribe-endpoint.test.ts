import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({
	name: 'gregory.sh',
	newsroomList: 'gregory_subscribers',
	kvWrites: true
}));

vi.mock('$lib/newsroom/config', () => ({ site: config }));

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

function api(status: number, body: unknown) {
	const calls: Request[] = [];
	const fetch = vi.fn(async (input: RequestInfo | URL) => {
		calls.push(input as Request);
		return new Response(JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' }
		});
	});
	return { calls, fetch: fetch as unknown as typeof globalThis.fetch };
}

function event(
	url: string,
	options: {
		kv?: ReturnType<typeof kv> | null;
		body?: string;
		token?: string | null;
		fetch?: typeof globalThis.fetch;
	} = {}
) {
	const store = options.kv === null ? undefined : (options.kv ?? kv());
	const env: Record<string, unknown> = { TURNSTILE_SECRET_KEY: 'turnstile-secret' };
	if (store) env.SUBSCRIBERS = store;
	if (options.token !== null) env.NEWSROOM_LISTS_TOKEN = options.token ?? 'tok';

	return {
		store,
		event: {
			url: new URL(url),
			request: new Request(url, { method: 'POST', body: options.body }),
			platform: { env },
			fetch: options.fetch ?? api(200, { status: 'removed' }).fetch
		} as unknown as Parameters<typeof POST>[0]
	};
}

async function redirectOf(e: Parameters<typeof GET>[0]) {
	return GET(e);
}

beforeEach(() => {
	config.kvWrites = true;
	verifyTurnstile.mockClear();
	verifyTurnstile.mockResolvedValue(true);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/unsubscribe with a token', () => {
	it('sends the token to the newsroom and answers 200 with an HTML page', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc.def-123', {
			body: 'List-Unsubscribe=One-Click',
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		expect(await response.text()).toContain('being removed');
		expect(verifyTurnstile).not.toHaveBeenCalled();

		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(
			'https://the-newsroom-lists.crafts.software/v1/lists/gregory_subscribers/unsubscribe'
		);
		expect(calls[0].headers.get('authorization')).toBe('Bearer tok');
		expect(await calls[0].clone().json()).toEqual({ token: 'abc.def-123' });
	});

	it('still writes the KV marker while kvWrites is on', async () => {
		const { fetch } = api(200, { status: 'removed' });
		const { event: e, store } = event(
			'https://gregory.sh/api/unsubscribe?token=abc.def-123',
			{ body: 'List-Unsubscribe=One-Click', fetch }
		);

		await POST(e);

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
		const { event: e, store } = event('https://gregory.sh/api/unsubscribe?token=abc.def-123');

		const response = await POST(e);

		expect(response.status).toBe(200);
		const [, value] = (store?.put as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(JSON.parse(value as string).via).toBe('confirm');
	});

	it('writes no marker once kvWrites is off', async () => {
		config.kvWrites = false;
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e, store } = event('https://gregory.sh/api/unsubscribe?token=abc.def-123', {
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(calls).toHaveLength(1);
		expect(store?.put).not.toHaveBeenCalled();
	});

	it('rejects an empty token before calling the newsroom', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e, store } = event('https://gregory.sh/api/unsubscribe?token=', { fetch });

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
		expect(store?.put).not.toHaveBeenCalled();
	});

	it('rejects a token with characters outside the allowed set', async () => {
		const { event: e, store } = event('https://gregory.sh/api/unsubscribe?token=abc%20def');

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

	it('answers 503 when the bearer token is missing', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			token: null,
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(503);
		expect(calls).toHaveLength(0);
	});

	it('answers 503 when the KV binding is missing and kvWrites is on', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			kv: null
		});

		const response = await POST(e);

		expect(response.status).toBe(503);
	});

	it('passes an API 400 detail back and answers 503 for a scope failure', async () => {
		const bad = api(400, { error: 'invalid_request', detail: 'stale link' });
		const { event: e1 } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			fetch: bad.fetch
		});
		const first = await POST(e1);
		expect(first.status).toBe(400);
		expect(await first.json()).toEqual({ error: 'stale link' });

		const forbidden = api(403, { error: 'forbidden', detail: 'wrong list' });
		const { event: e2, store } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			fetch: forbidden.fetch
		});
		const second = await POST(e2);
		expect(second.status).toBe(503);
		expect(await second.json()).toEqual({ error: 'Service unavailable' });
		expect(store?.put).not.toHaveBeenCalled();
	});
});

describe('POST /api/unsubscribe with a JSON body', () => {
	it('removes the address through the newsroom and from KV once Turnstile passes', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const store = kv(JSON.stringify({ subscribedAt: '2026-01-01T00:00:00.000Z' }));
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'Sam@Example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(verifyTurnstile).toHaveBeenCalledTimes(1);
		expect(await calls[0].clone().json()).toEqual({ email: 'sam@example.com' });
		expect(store.delete).toHaveBeenCalledWith('sam@example.com');
		expect(store.put).not.toHaveBeenCalled();
	});

	it('answers the same for an address that is not subscribed', async () => {
		const { fetch } = api(200, { status: 'unknown' });
		const store = kv(null);
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Unsubscribed successfully' });
		expect(store.delete).not.toHaveBeenCalled();
	});

	it('rejects a failed Turnstile check before calling the newsroom', async () => {
		verifyTurnstile.mockResolvedValue(false);
		const { calls, fetch } = api(200, { status: 'removed' });
		const store = kv(JSON.stringify({ subscribedAt: '2026-01-01T00:00:00.000Z' }));
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
		expect(store.delete).not.toHaveBeenCalled();
	});

	it('touches no KV once kvWrites is off', async () => {
		config.kvWrites = false;
		const { calls, fetch } = api(200, { status: 'removed' });
		const store = kv(JSON.stringify({ subscribedAt: '2026-01-01T00:00:00.000Z' }));
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(calls).toHaveLength(1);
		expect(store.delete).not.toHaveBeenCalled();
		expect(store.get).not.toHaveBeenCalled();
	});

	it('rejects an invalid address', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'not-an-email' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
	});

	it('answers 503 when the bearer token is missing', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			token: null,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		expect((await POST(e)).status).toBe(503);
	});

	it('answers 503 when the KV binding is missing and kvWrites is on', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: null,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		expect((await POST(e)).status).toBe(503);
	});

	it('answers 503 when the API cannot be reached', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('connect timed out');
		}) as unknown as typeof globalThis.fetch;
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		expect((await POST(e)).status).toBe(503);
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
