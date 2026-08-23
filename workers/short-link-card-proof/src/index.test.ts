import { describe, expect, it } from 'vitest';
import { handleRequest } from './handler';

describe('short-link card proof', () => {
	it.each(['GET', 'HEAD'])('redirects %s requests to the article', (method) => {
		const response = handleRequest(new Request('https://gregory.sh/z/test', { method }));

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(
			'https://gregory.sh/blog/human-friendly-skill'
		);
	});

	it('does not claim other paths under the route pattern', () => {
		const response = handleRequest(new Request('https://gregory.sh/z/testing'));

		expect(response.status).toBe(404);
	});

	it('rejects methods other than GET and HEAD', () => {
		const response = handleRequest(
			new Request('https://gregory.sh/z/test', { method: 'POST' })
		);

		expect(response.status).toBe(405);
		expect(response.headers.get('Allow')).toBe('GET, HEAD');
	});
});
