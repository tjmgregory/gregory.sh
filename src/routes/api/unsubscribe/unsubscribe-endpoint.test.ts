import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({
	name: 'gregory.sh',
	newsroomList: 'gregory_subscribers'
}));

vi.mock('$lib/newsroom/config', () => ({ site: config }));

const verifyTurnstile = vi.fn(async () => true);
vi.mock('$lib/server/turnstile', () => ({ verifyTurnstile }));

const { GET, POST } = await import('./+server');

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
		body?: string;
		token?: string | null;
		fetch?: typeof globalThis.fetch;
	} = {}
) {
	const env: Record<string, unknown> = { TURNSTILE_SECRET_KEY: 'turnstile-secret' };
	if (options.token !== null) env.NEWSROOM_LISTS_TOKEN = options.token ?? 'tok';

	return {
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

	it('rejects an empty token before calling the newsroom', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=', { fetch });

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
	});

	it('rejects a token with characters outside the allowed set', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe?token=abc%20def');

		const response = await POST(e);

		expect(response.status).toBe(400);
	});

	it('rejects a token over 512 characters', async () => {
		const longToken = 'a'.repeat(513);
		const { event: e } = event(`https://gregory.sh/api/unsubscribe?token=${longToken}`);

		const response = await POST(e);

		expect(response.status).toBe(400);
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

	it('passes an API 400 detail back and answers 503 for a scope failure', async () => {
		const bad = api(400, { error: 'invalid_request', detail: 'stale link' });
		const { event: e1 } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			fetch: bad.fetch
		});
		const first = await POST(e1);
		expect(first.status).toBe(400);
		expect(await first.json()).toEqual({ error: 'stale link' });

		const forbidden = api(403, { error: 'forbidden', detail: 'wrong list' });
		const { event: e2 } = event('https://gregory.sh/api/unsubscribe?token=abc.def', {
			fetch: forbidden.fetch
		});
		const second = await POST(e2);
		expect(second.status).toBe(503);
		expect(await second.json()).toEqual({ error: 'Service unavailable' });
	});
});

describe('POST /api/unsubscribe with a JSON body', () => {
	it('removes the address through the newsroom once Turnstile passes', async () => {
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'Sam@Example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(verifyTurnstile).toHaveBeenCalledTimes(1);
		expect(await calls[0].clone().json()).toEqual({ email: 'sam@example.com' });
	});

	it('answers the same for an address that is not subscribed', async () => {
		const { fetch } = api(200, { status: 'unknown' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Unsubscribed successfully' });
	});

	it('rejects a failed Turnstile check before calling the newsroom', async () => {
		verifyTurnstile.mockResolvedValue(false);
		const { calls, fetch } = api(200, { status: 'removed' });
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' }),
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
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
