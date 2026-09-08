/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { GET as healthz } from '../src/routes/healthz/+server';
import { POST as subscribe } from '../src/routes/api/subscribe/+server';
import { GET as rssStats } from '../src/routes/api/rss-stats/+server';

declare global {
	namespace Cloudflare { interface Env { HEALTH_STATE: DurableObjectNamespace } }
}

function request(path: string, body?: unknown) {
	return new Request(`https://health.internal${path}`, {
		method: body ? 'POST' : 'GET',
		body: body ? JSON.stringify(body) : undefined,
		headers: body ? { 'Content-Type': 'application/json' } : undefined
	});
}

function platform() {
	const pending: Promise<unknown>[] = [];
	return {
		pending,
		value: {
			env: { ...env, RSS_STATS: rssKv(), TURNSTILE_SECRET_KEY: 'test-secret', NEWSROOM_LISTS_TOKEN: 'token', HEALTH_ENVIRONMENT: 'preview', CF_PAGES_COMMIT_SHA: 'release' },
			context: { waitUntil: (promise: Promise<unknown>) => pending.push(promise) }
		} as unknown as App.Platform
	};
}

function rssKv(): KVNamespace {
	return { get: async () => null, put: async () => undefined } as unknown as KVNamespace;
}

describe('Gregory health runtime', () => {
	it('reads actual Sentinel HealthState after an independent stored failure', async () => {
		const state = platform();
		const id = env.HEALTH_STATE.idFromName('gregory-sh-web:preview');
		const stub = env.HEALTH_STATE.get(id);
		const identity = { version: 1, serviceId: 'gregory-sh-web', environment: 'preview' };
		const operation = { operation: 'lists-subscribe', kind: 'dependency', componentId: 'the-newsroom-lists', cadenceSeconds: 300 };
		expect((await stub.fetch(request('/v1/register', { ...identity, operations: [operation] }))).status).toBe(200);
		await stub.fetch(request('/v1/observations', { ...identity, ...operation, outcome: 'failure', observedAt: new Date(Date.now() - 1000).toISOString(), error: 'lists unavailable' }));
		const response = await healthz({ platform: state.value } as never);
		const body = await response.json() as { status: string; serviceId: string };
		expect(response.status).toBe(200);
		expect(body).toMatchObject({ status: 'pass', serviceId: 'gregory-sh-web' });
	});

	it('records real subscribe and RSS handlers before reading healthz', async () => {
		const state = platform();
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => Response.json({ success: true, action: 'newsletter_subscribe', hostname: 'gregory.sh' });
		const listFetch = async () => Response.json({ ok: true });
		const subscribeResponse = await subscribe({
			request: new Request('https://gregory.sh/api/subscribe', { method: 'POST', body: JSON.stringify({ email: 'a@example.com', turnstileToken: 'token' }), headers: { 'content-type': 'application/json' } }),
			platform: state.value,
			fetch: listFetch
		} as never);
		const rssResponse = await rssStats({ platform: state.value } as never);
		await Promise.all(state.pending);
		const response = await healthz({ platform: state.value } as never);
		const body = await response.json() as { status: string; serviceId: string };
		globalThis.fetch = originalFetch;
		expect(subscribeResponse.status).toBe(200);
		expect(rssResponse.status).toBe(200);
		expect(response.status).toBe(200);
		expect(body).toMatchObject({ status: 'pass', serviceId: 'gregory-sh-web' });
	});
});
