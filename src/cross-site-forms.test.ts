import { describe, expect, it } from 'vitest';
import { isCrossSiteFormPost } from './cross-site-forms';

function post(
	path: string,
	options: { contentType?: string; origin?: string; method?: string } = {}
) {
	const url = new URL(`https://example.com${path}`);
	const headers = new Headers();
	if (options.contentType) headers.set('content-type', options.contentType);
	if (options.origin) headers.set('origin', options.origin);
	const request = new Request(url, {
		method: options.method ?? 'POST',
		headers
	});
	return { request, url };
}

describe('cross-site form posts', () => {
	it('blocks a form post from another origin', () => {
		const { request, url } = post('/', {
			contentType: 'application/x-www-form-urlencoded',
			origin: 'https://attacker.example'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(true);
	});

	it('blocks a form post with no origin', () => {
		const { request, url } = post('/', { contentType: 'text/plain' });

		expect(isCrossSiteFormPost(request, url)).toBe(true);
	});

	it('allows a form post from the site itself', () => {
		const { request, url } = post('/', {
			contentType: 'multipart/form-data; boundary=x',
			origin: 'https://example.com'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(false);
	});

	it('allows a JSON post from anywhere', () => {
		const { request, url } = post('/api/unsubscribe', {
			contentType: 'application/json',
			origin: 'https://attacker.example'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(false);
	});

	it('allows the one-click unsubscribe post a mail client makes', () => {
		const { request, url } = post('/api/unsubscribe?token=abc.def', {
			contentType: 'application/x-www-form-urlencoded'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(false);
	});

	it('blocks a form post to unsubscribe with no token', () => {
		const { request, url } = post('/api/unsubscribe', {
			contentType: 'application/x-www-form-urlencoded'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(true);
	});

	it('leaves GET alone', () => {
		const { request, url } = post('/', {
			method: 'GET',
			contentType: 'application/x-www-form-urlencoded'
		});

		expect(isCrossSiteFormPost(request, url)).toBe(false);
	});
});
