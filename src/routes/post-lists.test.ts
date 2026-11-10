import { describe, expect, it, vi } from 'vitest';
import { middle, newer, older, postsKv } from '$lib/server/posts.fixtures';
import { summaryOf } from '$lib/server/posts';

vi.mock('$lib/health.server', () => ({
	observeDatastore: (_platform: unknown, _operation: string, run: () => Promise<unknown>) => run()
}));

const home = await import('./+page.server');
const blog = await import('./blog/+page.server');

type Load = (event: never) => Promise<unknown>;

describe.each([
	['home', home.load as Load],
	['blog index', blog.load as Load]
])('%s load', (_name, load) => {
	it('lists published posts from KV, newest first, with the posts cache policy', async () => {
		const setHeaders = vi.fn();
		const { kv } = postsKv();
		const data = await load({ platform: { env: { POSTS: kv } }, setHeaders } as never);

		expect(data).toEqual({ posts: [newer, middle, older].map(summaryOf) });
		expect(setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=0, s-maxage=30'
		});
	});
});
