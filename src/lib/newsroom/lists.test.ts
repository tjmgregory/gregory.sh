import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsroomListsError } from './client.server';
import { listsClientFor, listsErrorResponse, readFields } from './lists.server';

describe('listsClientFor', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('builds a client from the env token', () => {
		expect(listsClientFor({ NEWSROOM_LISTS_TOKEN: 'tok' })).not.toBeNull();
	});

	it('returns null with no token, and logs it once', async () => {
		const fresh = await import('./lists.server');
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

		expect(fresh.listsClientFor(undefined)).toBeNull();
		expect(fresh.listsClientFor({})).toBeNull();

		expect(logged).toHaveBeenCalledTimes(1);
		expect(String(logged.mock.calls[0][0])).toContain('NEWSROOM_LISTS_TOKEN');
		logged.mockRestore();
	});
});

describe('listsErrorResponse', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('passes a 400 detail through', async () => {
		const response = listsErrorResponse(
			new NewsroomListsError(400, 'invalid_request', 'email is required')
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'email is required' });
	});

	it.each([
		401, 403, 404, 500, 0
	])('answers 503 for a %i failure', async (status) => {
		const response = listsErrorResponse(
			new NewsroomListsError(status, 'nope', 'nope')
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Service unavailable' });
	});

	it('answers 503 for anything that is not a lists error', async () => {
		const response = listsErrorResponse(new Error('boom'));

		expect(response.status).toBe(503);
	});
});

describe('readFields', () => {
	it('keeps primitives and drops everything else', () => {
		expect(
			readFields({
				plan: 'business',
				seats: 4,
				beta: true,
				nested: { a: 1 },
				list: [1, 2],
				nothing: null
			})
		).toEqual({ plan: 'business', seats: 4, beta: true });
	});

	it('is undefined when there is nothing usable', () => {
		expect(readFields(undefined)).toBeUndefined();
		expect(readFields('fields')).toBeUndefined();
		expect(readFields([1, 2])).toBeUndefined();
		expect(readFields({ nested: { a: 1 } })).toBeUndefined();
	});
});
