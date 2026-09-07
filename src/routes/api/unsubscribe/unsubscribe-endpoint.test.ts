import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UNSUBSCRIBE_AUDIENCE } from '$lib/unsubscribe-config';
import { createUnsubscribeToken } from '$lib/unsubscribe-token';

const verifyTurnstile = vi.fn(async () => true);
vi.mock('$lib/server/turnstile', () => ({ verifyTurnstile }));

const { GET, POST } = await import('./+server');

const secret = 'f'.repeat(64);
const venture: string = UNSUBSCRIBE_AUDIENCE;

function kv(existing: string | null = null) {
	return {
		get: vi.fn(async () => existing),
		put: vi.fn(async () => undefined),
		delete: vi.fn(async () => undefined)
	};
}

function event(
	url: string,
	options: { kv?: ReturnType<typeof kv>; body?: string } = {}
) {
	const store = options.kv ?? kv();
	return {
		store,
		event: {
			url: new URL(url),
			request: new Request(url, { method: 'POST', body: options.body }),
			platform: {
				env: {
					SUBSCRIBERS: store,
					TURNSTILE_SECRET_KEY: 'turnstile-secret',
					UNSUBSCRIBE_SECRET: secret
				}
			}
		} as unknown as Parameters<typeof POST>[0]
	};
}

async function token(email = 'sam@example.com', signedVenture = venture) {
	return createUnsubscribeToken({ email, venture: signedVenture, secret });
}

async function redirectOf(e: Parameters<typeof GET>[0]) {
	try {
		await GET(e);
	} catch (thrown) {
		return thrown as { status: number; location: string };
	}
	throw new Error('expected a redirect');
}

beforeEach(() => {
	verifyTurnstile.mockClear();
	verifyTurnstile.mockResolvedValue(true);
});

describe('POST /api/unsubscribe with a signed token', () => {
	it('removes the address and answers 200 without a Turnstile check', async () => {
		const signed = await token();
		const { event: e, store } = event(
			`https://gregory.sh/api/unsubscribe?token=${signed}`,
			{ body: 'List-Unsubscribe=One-Click' }
		);

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			message: 'Unsubscribed successfully'
		});
		expect(store.delete).toHaveBeenCalledWith('sam@example.com');
		expect(verifyTurnstile).not.toHaveBeenCalled();
	});

	it('answers 400 and leaves the store alone when the signature is tampered', async () => {
		const signed = await token();
		const tampered = `${signed.slice(0, -1)}${signed.endsWith('A') ? 'B' : 'A'}`;
		const { event: e, store } = event(
			`https://gregory.sh/api/unsubscribe?token=${tampered}`
		);

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store.delete).not.toHaveBeenCalled();
		expect(store.get).not.toHaveBeenCalled();
	});

	it('answers 400 for a token signed for another venture', async () => {
		const signed = await token('sam@example.com', 'other_waitlist');
		const { event: e, store } = event(
			`https://gregory.sh/api/unsubscribe?token=${signed}`
		);

		const response = await POST(e);

		expect(response.status).toBe(400);
		expect(store.delete).not.toHaveBeenCalled();
	});

	it('says nothing about whether the address was subscribed', async () => {
		const signed = await token();
		const { event: e } = event(
			`https://gregory.sh/api/unsubscribe?token=${signed}`,
			{ kv: kv(null) }
		);

		const response = await POST(e);

		expect(await response.json()).toEqual({
			message: 'Unsubscribed successfully'
		});
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
	});

	it('answers the same for an address that is not subscribed', async () => {
		const store = kv(null);
		const { event: e } = event('https://gregory.sh/api/unsubscribe', {
			kv: store,
			body: JSON.stringify({ email: 'sam@example.com', turnstileToken: 'tok' })
		});

		const response = await POST(e);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			message: 'Unsubscribed successfully'
		});
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
});

describe('GET /api/unsubscribe', () => {
	it('sends a token on to the human page', async () => {
		const signed = await token();
		const { event: e } = event(
			`https://gregory.sh/api/unsubscribe?token=${signed}`
		);

		const redirect = await redirectOf(e);

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe(
			`/unsubscribe?token=${encodeURIComponent(signed)}`
		);
	});

	it('sends a link with no token to the plain page', async () => {
		const { event: e } = event('https://gregory.sh/api/unsubscribe');

		const redirect = await redirectOf(e);

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/unsubscribe');
	});
});
