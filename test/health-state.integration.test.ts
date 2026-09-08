/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { GET as healthz } from '../src/routes/healthz/+server';
import { POST as subscribe } from '../src/routes/api/subscribe/+server';
import { GET as rssStats } from '../src/routes/api/rss-stats/+server';
import { GET as rssXml } from '../src/routes/rss.xml/+server';

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

function platform(recorderFailure = false) {
	const pending: Promise<unknown>[] = [];
	const healthState = { getByName(name: string) { const stub = env.HEALTH_STATE.getByName(name); return { fetch(input: RequestInfo | URL, init?: RequestInit) { if (recorderFailure && new URL(String(input)).pathname === '/v1/observations') return Promise.reject(new Error('recorder unavailable')); return stub.fetch(input, init); } }; } };
	return {
		pending,
		value: {
			env: { ...env, HEALTH_STATE: healthState, RSS_STATS: rssKv(), TURNSTILE_SECRET_KEY: 'test-secret', NEWSROOM_LISTS_TOKEN: 'token', HEALTH_ENVIRONMENT: 'preview', CF_PAGES_COMMIT_SHA: 'release' },
			context: { waitUntil: (promise: Promise<unknown>) => pending.push(promise) }
		} as unknown as App.Platform
	};
}

function rssKv(failPut = false): KVNamespace {
	return { get: async () => null, put: async () => { if (failPut) throw new Error('RSS stats unavailable'); } } as unknown as KVNamespace;
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
		let listStatus = 200;
		const listFetch = async () => new Response(JSON.stringify({ ok: listStatus === 200 }), { status: listStatus, headers: { 'content-type': 'application/json' } });
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
		globalThis.fetch = async () => Response.json({ success: true, action: 'newsletter_subscribe', hostname: 'gregory.sh' });
		listStatus = 503;
		const failedSubscribe = await subscribe({
			request: new Request('https://gregory.sh/api/subscribe', { method: 'POST', body: JSON.stringify({ email: 'b@example.com', turnstileToken: 'token' }), headers: { 'content-type': 'application/json' } }),
			platform: state.value,
			fetch: listFetch
		} as never);
		await Promise.all(state.pending);
		const warned = await healthz({ platform: state.value } as never);
		const warnedBody = await warned.json() as { status: string; checks: Record<string, Array<{ status: string }>> };
		expect(failedSubscribe.status).toBe(503);
		expect(warned.status).toBe(200);
		expect(warnedBody.checks['lists-subscribe'][0].status).toBe('warn');
	});

	it('keeps RSS get success separate from a real put failure', async () => {
		const state = platform();
		const failed = { ...state.value, env: { ...state.value.env, RSS_STATS: rssKv(true) } } as App.Platform;
		const response = await rssXml({ request: new Request('https://gregory.sh/rss.xml', { headers: { 'user-agent': 'Feedly/1.0; 3 subscribers' } }), platform: failed } as never);
		await Promise.all(state.pending);
		const health = await healthz({ platform: failed } as never);
		expect(response.status).toBe(200);
		expect(health.status).toBe(503);
	});

	it('preserves a visitor Lists 400 and business success on recorder failure', async () => {
		const state = platform(true);
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => Response.json({ success: true, action: 'newsletter_subscribe', hostname: 'gregory.sh' });
		const response = await subscribe({ request: new Request('https://gregory.sh/api/subscribe', { method: 'POST', body: JSON.stringify({ email: 'x@example.com', turnstileToken: 'token' }), headers: { 'content-type': 'application/json' } }), platform: state.value, fetch: async () => new Response(JSON.stringify({ detail: 'invalid fields' }), { status: 400 }) } as never);
		const success = await subscribe({ request: new Request('https://gregory.sh/api/subscribe', { method: 'POST', body: JSON.stringify({ email: 'y@example.com', turnstileToken: 'token' }), headers: { 'content-type': 'application/json' } }), platform: state.value, fetch: async () => Response.json({ ok: true }) } as never);
		globalThis.fetch = originalFetch;
		expect(response.status).toBe(400);
		expect(success.status).toBe(200);
	});
});
