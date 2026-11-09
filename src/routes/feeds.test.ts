import { describe, expect, it, vi } from 'vitest';
import { contract, middle, newer, older, postsKv } from '$lib/server/posts.fixtures';

vi.mock('$lib/health.server', () => ({
	observeDatastore: (_platform: unknown, _operation: string, run: () => Promise<unknown>) => run()
}));

const rss = await import('./rss.xml/+server');
const sitemap = await import('./sitemap.xml/+server');

function event(entries = contract([older, newer, middle])) {
	const { kv } = postsKv(entries);
	return {
		request: new Request('https://gregory.sh/rss.xml'),
		platform: { env: { POSTS: kv } }
	} as never;
}

describe('GET /rss.xml', () => {
	it('lists published posts from KV, newest first', async () => {
		const response = await rss.GET(event());
		const xml = await response.text();

		expect(response.headers.get('content-type')).toBe('application/xml');
		const links = [...xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((match) => match[1]);
		expect(links).toEqual([
			'https://gregory.sh/blog/parkinsons-law-testflight',
			'https://gregory.sh/blog/human-friendly-skill',
			'https://gregory.sh/blog/building-inc'
		]);
		expect(xml).toContain(
			'<description>Then a friend reminded me about Parkinson&apos;s law.</description>'
		);
		expect(xml).toContain('<pubDate>Thu, 06 Aug 2026 07:00:00 GMT</pubDate>');
	});

	it('is an empty channel when nothing is published', async () => {
		const xml = await (await rss.GET(event({}))).text();
		expect(xml).toContain('<channel>');
		expect(xml).not.toContain('<item>');
	});
});

describe('GET /sitemap.xml', () => {
	it('lists the fixed pages and every published post with its last change', async () => {
		const response = await sitemap.GET(
			event(contract([older, { ...newer, updated: '2026-09-01T09:00:00+01:00' }]))
		);
		const xml = await response.text();

		expect(response.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=30');
		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
		expect(locs).toEqual([
			'https://gregory.sh',
			'https://gregory.sh/ideas',
			'https://gregory.sh/about',
			'https://gregory.sh/blog',
			'https://gregory.sh/subscribe',
			'https://gregory.sh/blog/parkinsons-law-testflight',
			'https://gregory.sh/blog/building-inc'
		]);
		expect(xml).toContain('<lastmod>2026-09-01T09:00:00+01:00</lastmod>');
		expect(xml).toContain('<lastmod>2026-02-09T16:30:00.000Z</lastmod>');
	});
});
