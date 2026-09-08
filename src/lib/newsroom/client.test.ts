import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createListsClient,
	DEFAULT_LISTS_URL,
	NewsroomListsError
} from './client.server';

function answering(
	status: number,
	body: unknown
): { fetch: typeof globalThis.fetch; calls: Request[] } {
	const calls: Request[] = [];
	const fetch = vi.fn(async (input: RequestInfo | URL) => {
		calls.push(input as Request);
		return new Response(JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' }
		});
	});
	return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

async function sent(request: Request) {
	return {
		method: request.method,
		url: request.url,
		authorization: request.headers.get('authorization'),
		body: await request.clone().json()
	};
}

describe('createListsClient', () => {
	let logged: unknown[][];

	beforeEach(() => {
		logged = [];
		vi.spyOn(console, 'error').mockImplementation((...args) => {
			logged.push(args);
		});
	});

	it('posts a subscribe with the list, the bearer and the body', async () => {
		const { fetch, calls } = answering(200, { status: 'subscribed' });
		const client = createListsClient({ token: 'tok-123', fetch });

		const result = await client.subscribe('template_waitlist', 'sam@a.com');

		expect(result).toEqual({ status: 'subscribed' });
		const call = await sent(calls[0]);
		expect(call.method).toBe('POST');
		expect(call.url).toBe(
			`${DEFAULT_LISTS_URL}/v1/lists/template_waitlist/subscribe`
		);
		expect(call.authorization).toBe('Bearer tok-123');
		expect(call.body).toEqual({ email: 'sam@a.com' });
	});

	it('carries fields when the list asks for extras', async () => {
		const { fetch, calls } = answering(200, { status: 'already' });
		const client = createListsClient({ token: 'tok', fetch });

		await client.subscribe('pms_waitlist', 'sam@a.com', { plan: 'business' });

		expect((await sent(calls[0])).body).toEqual({
			email: 'sam@a.com',
			fields: { plan: 'business' }
		});
	});

	it('honours a base URL override', async () => {
		const { fetch, calls } = answering(200, { status: 'removed' });
		const client = createListsClient({
			baseUrl: 'https://lists.example.test',
			token: 'tok',
			fetch
		});

		await client.unsubscribe('template_waitlist', { email: 'sam@a.com' });

		expect((await sent(calls[0])).url).toBe(
			'https://lists.example.test/v1/lists/template_waitlist/unsubscribe'
		);
	});

	it('posts an unsubscribe by token', async () => {
		const { fetch, calls } = answering(200, { status: 'removed' });
		const client = createListsClient({ token: 'tok', fetch });

		await client.unsubscribe('template_waitlist', { token: 'unsub.tok-1' });

		expect((await sent(calls[0])).body).toEqual({ token: 'unsub.tok-1' });
	});

	it('reads a member with the address encoded into the path', async () => {
		const { fetch, calls } = answering(200, {
			status: 'subscribed',
			joined_at: '2026-01-01T00:00:00.000Z'
		});
		const client = createListsClient({ token: 'tok', fetch });

		const result = await client.member('template_waitlist', 'sam+x@a.com');

		expect(result.status).toBe('subscribed');
		expect(calls[0].url).toBe(
			`${DEFAULT_LISTS_URL}/v1/lists/template_waitlist/members/sam%2Bx%40a.com`
		);
	});

	it('turns a non-2xx into a typed error carrying status, code and detail', async () => {
		const { fetch } = answering(403, {
			error: 'forbidden',
			detail: 'that token may not touch this list'
		});
		const client = createListsClient({ token: 'tok', fetch });

		const error = await client
			.subscribe('other_waitlist', 'sam@a.com')
			.catch((e) => e);

		expect(error).toBeInstanceOf(NewsroomListsError);
		expect(error.status).toBe(403);
		expect(error.code).toBe('forbidden');
		expect(error.detail).toBe('that token may not touch this list');
	});

	it('turns a network failure into a typed error with status 0', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('connect timed out');
		}) as unknown as typeof globalThis.fetch;
		const client = createListsClient({ token: 'tok', fetch });

		const error = await client
			.subscribe('template_waitlist', 'sam@a.com')
			.catch((e) => e);

		expect(error).toBeInstanceOf(NewsroomListsError);
		expect(error.status).toBe(0);
		expect(error.code).toBe('network');
		expect(error.detail).toBe('connect timed out');
	});

	it('still reports a failure the API described with no JSON body', async () => {
		const fetch = vi.fn(
			async () => new Response('gateway down', { status: 502 })
		) as unknown as typeof globalThis.fetch;
		const client = createListsClient({ token: 'tok', fetch });

		const error = await client
			.subscribe('template_waitlist', 'sam@a.com')
			.catch((e) => e);

		expect(error).toBeInstanceOf(NewsroomListsError);
		expect(error.status).toBe(502);
		expect(error.code).toBe('unknown');
	});
});
