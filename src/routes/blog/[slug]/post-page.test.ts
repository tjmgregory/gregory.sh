import { cleanup, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { middle, newer, older, postsKv } from '$lib/server/posts.fixtures';
import { summaryOf } from '$lib/server/posts';

vi.mock('$lib/health.server', () => ({
	observeDatastore: (_platform: unknown, _operation: string, run: () => Promise<unknown>) => run()
}));

const { load } = await import('./+page.server');
const { default: Page } = await import('./+page.svelte');

type LoadEvent = Parameters<typeof load>[0];

function event(slug: string) {
	const setHeaders = vi.fn();
	const { kv } = postsKv();
	return {
		setHeaders,
		event: { params: { slug }, platform: { env: { POSTS: kv } }, setHeaders } as unknown as LoadEvent
	};
}

afterEach(cleanup);
beforeEach(() => {
	document.head.innerHTML = '';
});

describe('blog post load', () => {
	it('answers 404 for a slug with no published post, and is not cached', async () => {
		const { event: e, setHeaders } = event('not-published');
		await expect(load(e)).rejects.toMatchObject({ status: 404 });
		expect(setHeaders).not.toHaveBeenCalled();
	});

	it('returns the rendered post and the two newest other posts', async () => {
		const { event: e, setHeaders } = event('building-inc');
		const data = (await load(e)) as Record<string, unknown>;

		expect(data.post).toEqual(summaryOf(older));
		expect(data.html).toBe(
			'<p>Software is getting cheap. It’s <a href="/blog/inc">Inc</a>.</p>'
		);
		expect(data.morePosts).toEqual([summaryOf(newer), summaryOf(middle)]);
		expect(setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=0, s-maxage=30'
		});
	});
});

describe('blog post page', () => {
	function renderPage(post: typeof older, morePosts = [summaryOf(newer)]) {
		return render(Page, {
			props: {
				data: { post: summaryOf(post), html: '<p>Rendered <em>body</em></p>', morePosts }
			} as never
		});
	}

	it('shows the rendered HTML, title, date and more writing', () => {
		const { container, getByRole } = renderPage(older);
		expect(container.querySelector('.post-content')?.innerHTML).toContain(
			'<p>Rendered <em>body</em></p>'
		);
		expect(getByRole('heading', { level: 1 }).textContent).toBe(older.title);
		expect(container.querySelector('.post-header time')?.getAttribute('datetime')).toBe(older.date);
		expect(container.querySelector('.more-writing a[href="/blog/parkinsons-law-testflight"]')).not.toBeNull();
	});

	it('keeps canonical, OG and JSON-LD on gregory.sh', () => {
		renderPage(newer);
		const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');
		expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
			'https://gregory.sh/blog/parkinsons-law-testflight'
		);
		expect(document.title).toBe(`${newer.seoTitle} | Theo Gregory`);
		expect(meta('meta[property="article:published_time"]')).toBe(newer.date);
		expect(meta('meta[property="og:image"]')).toBe('https://gregory.sh/og-image.png');
		const jsonLd = JSON.parse(
			document.head.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}'
		);
		expect(jsonLd).toMatchObject({
			'@type': 'Article',
			headline: newer.title,
			datePublished: newer.date,
			keywords: "parkinson's law"
		});
	});

	it('uses an absolute ogImage as given and puts a path on gregory.sh', () => {
		renderPage(middle);
		expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
			'https://assets.crafts.software/og/human-friendly-skill.png'
		);
		cleanup();
		document.head.innerHTML = '';

		renderPage({ ...older, ogImage: '/og/building-inc.png' });
		expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
			'https://gregory.sh/og/building-inc.png'
		);
	});
});
