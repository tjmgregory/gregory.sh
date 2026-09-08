import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({
	name: 'gregory.sh',
	newsroomList: 'gregory_subscribers'
}));

vi.mock('$lib/newsroom/config', () => ({ site: config }));

const verifyTurnstile = vi.fn(async () => true);
vi.mock('$lib/server/turnstile', () => ({ verifyTurnstile, hasValidTurnstileInput: vi.fn(() => true), verifyTurnstileResult: vi.fn(async () => ({ accepted: await verifyTurnstile(), available: true, attempted: true })) }));

const { POST } = await import('./+server');

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

function event(options: {
	body?: unknown;
	token?: string | null;
	listsUrl?: string;
	fetch?: typeof globalThis.fetch;
}) {
	const env: Record<string, unknown> = { TURNSTILE_SECRET_KEY: 'turnstile-secret' };
	if (options.token !== null) env.NEWSROOM_LISTS_TOKEN = options.token ?? 'tok';
	if (options.listsUrl) env.NEWSROOM_LISTS_URL = options.listsUrl;

	return {
		event: {
			request: new Request('https://gregory.sh/api/subscribe', {
				method: 'POST',
				body: JSON.stringify(
					options.body ?? { email: 'sam@example.com', turnstileToken: 'tok' }
				)
			}),
			url: new URL('https://gregory.sh/api/subscribe'),
			platform: { env },
			fetch: options.fetch ?? api(200, { status: 'subscribed' }).fetch
		} as unknown as Parameters<typeof POST>[0]
	};
}

describe('POST /api/subscribe', () => {
	beforeEach(() => {
		verifyTurnstile.mockClear();
		verifyTurnstile.mockResolvedValue(true);
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('subscribes through the newsroom once Turnstile passes', async () => {
		const { calls, fetch } = api(200, { status: 'subscribed' });
		const { event: e } = event({
			body: { email: 'Sam@Example.com', turnstileToken: 'tok' },
			fetch
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Subscribed successfully' });
		expect(verifyTurnstile).toHaveBeenCalledTimes(1);
		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(
			'https://the-newsroom-lists.crafts.software/v1/lists/gregory_subscribers/subscribe'
		);
		expect(calls[0].headers.get('authorization')).toBe('Bearer tok');
		expect(await calls[0].clone().json()).toEqual({ email: 'sam@example.com' });
	});

	it('rejects a failed Turnstile check before calling the newsroom', async () => {
		verifyTurnstile.mockResolvedValue(false);
		const { calls, fetch } = api(200, { status: 'subscribed' });
		const { event: e } = event({ fetch });

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(calls).toHaveLength(0);
	});

	it('uses the configured lists host when one is set', async () => {
		const { calls, fetch } = api(200, { status: 'subscribed' });
		const { event: e } = event({ fetch, listsUrl: 'https://lists.example.test' });

		await POST(e);

		expect(calls[0].url).toBe(
			'https://lists.example.test/v1/lists/gregory_subscribers/subscribe'
		);
	});

	it('answers the same message for an address already subscribed', async () => {
		const { fetch } = api(200, { status: 'already' });
		const { event: e } = event({ fetch });

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Subscribed successfully' });
	});

	it('rejects an invalid address before verifying Turnstile', async () => {
		const { calls, fetch } = api(200, { status: 'subscribed' });
		const { event: e } = event({ body: { email: 'not-an-email' }, fetch });

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(verifyTurnstile).not.toHaveBeenCalled();
		expect(calls).toHaveLength(0);
	});

	it('answers 503 when the bearer token is missing', async () => {
		const { calls, fetch } = api(200, { status: 'subscribed' });
		const { event: e } = event({ token: null, fetch });

		const response = await POST(e);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Service unavailable' });
		expect(calls).toHaveLength(0);
	});

	it('passes an API 400 detail back to the browser', async () => {
		const { fetch } = api(400, {
			error: 'invalid_request',
			detail: 'email is not deliverable'
		});
		const { event: e } = event({ fetch });

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'email is not deliverable' });
	});

	it.each([401, 403, 404])('answers 503 when the API answers %i', async (status) => {
		const { fetch } = api(status, { error: 'nope', detail: 'nope' });
		const { event: e } = event({ fetch });

		const response = await POST(e);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Service unavailable' });
	});

	it('answers 503 when the API cannot be reached', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('connect timed out');
		}) as unknown as typeof globalThis.fetch;
		const { event: e } = event({ fetch });

		expect((await POST(e)).status).toBe(503);
	});
});
