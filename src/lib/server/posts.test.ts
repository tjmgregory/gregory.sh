import { beforeEach, describe, expect, it, vi } from 'vitest';
import { middle, newer, older, postsKv } from './posts.fixtures';

const observeDatastore = vi.hoisted(() =>
	vi.fn((_platform: unknown, _operation: string, run: () => Promise<unknown>) => run())
);
vi.mock('$lib/health.server', () => ({ observeDatastore }));

const { listPosts, loadPostList, loadPostPage, readPost, renderPost, summaryOf } = await import(
	'./posts'
);

beforeEach(() => {
	observeDatastore.mockClear();
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('listPosts', () => {
	it('reads the index as JSON with a 30 second edge cache', async () => {
		const { kv, get } = postsKv();
		await listPosts(kv);
		expect(get).toHaveBeenCalledWith('index', { type: 'json', cacheTtl: 30 });
	});

	it('returns posts newest first, whatever order the index holds', async () => {
		const { kv } = postsKv({ index: [older, newer, middle].map(summaryOf) });
		expect((await listPosts(kv)).map((post) => post.slug)).toEqual([
			'parkinsons-law-testflight',
			'human-friendly-skill',
			'building-inc'
		]);
	});

	it('has no posts when the index key is missing', async () => {
		const { kv } = postsKv({});
		expect(await listPosts(kv)).toEqual([]);
	});

	it('keeps only contract fields, and treats null optionals as absent', async () => {
		const { kv } = postsKv({
			index: [{ ...summaryOf(older), keywords: null, seoTitle: null, extra: 'x', markdown: '# no' }]
		});
		expect(await listPosts(kv)).toEqual([summaryOf(older)]);
	});

	it('skips an index entry that breaks the contract and logs it', async () => {
		const { kv } = postsKv({
			index: [summaryOf(newer), { ...summaryOf(older), date: 'not a date' }, { slug: 'x' }]
		});
		expect((await listPosts(kv)).map((post) => post.slug)).toEqual(['parkinsons-law-testflight']);
		expect(console.error).toHaveBeenCalledTimes(2);
	});

	it('fails when the index is not an array', async () => {
		const { kv } = postsKv({ index: { posts: [] } });
		await expect(listPosts(kv)).rejects.toThrow('not an array');
	});
});

describe('readPost', () => {
	it('reads post:<slug> as JSON with a 30 second edge cache', async () => {
		const { kv, get } = postsKv();
		expect(await readPost(kv, 'building-inc')).toEqual(older);
		expect(get).toHaveBeenCalledWith('post:building-inc', { type: 'json', cacheTtl: 30 });
	});

	it('returns null for a post that is not published', async () => {
		const { kv } = postsKv();
		expect(await readPost(kv, 'draft-post')).toBeNull();
	});

	it('does not ask KV for a key longer than KV allows, counted in bytes', async () => {
		const { kv, get } = postsKv();
		expect(await readPost(kv, '😀'.repeat(127))).toBeNull();
		expect(await readPost(kv, 'x'.repeat(508))).toBeNull();
		expect(get).not.toHaveBeenCalled();
		await readPost(kv, 'x'.repeat(507));
		expect(get).toHaveBeenCalledTimes(1);
	});

	it('fails on a value that breaks the contract', async () => {
		const { kv } = postsKv({
			'post:building-inc': { ...older, slug: 'something-else' },
			'post:no-markdown': summaryOf({ ...older, slug: 'no-markdown' })
		});
		await expect(readPost(kv, 'building-inc')).rejects.toThrow('does not match the posts contract');
		await expect(readPost(kv, 'no-markdown')).rejects.toThrow('does not match the posts contract');
	});
});

describe('loaders', () => {
	it('observe their KV reads as the posts datastore', async () => {
		const { kv } = postsKv();
		const platform = { env: { POSTS: kv } } as unknown as App.Platform;

		expect(await loadPostList(platform)).toHaveLength(3);
		const page = await loadPostPage(platform, 'human-friendly-skill');

		expect(page.post).toEqual(middle);
		expect(page.posts).toHaveLength(3);
		expect(observeDatastore.mock.calls.map((call) => call[1])).toEqual(['posts-get', 'posts-get']);
	});

	it('fail without the POSTS binding', async () => {
		await expect(loadPostList({ env: {} } as unknown as App.Platform)).rejects.toThrow(
			'POSTS binding unavailable'
		);
		await expect(loadPostPage(undefined, 'building-inc')).rejects.toThrow('POSTS binding unavailable');
	});
});

describe('renderPost', () => {
	it('renders markdown to the post HTML and re-renders when the markdown changes', () => {
		expect(renderPost(older)).toBe(
			'<p>Software is getting cheap. It’s <a href="/blog/inc">Inc</a>.</p>'
		);
		expect(renderPost({ ...older, markdown: 'Edited.\n' })).toBe('<p>Edited.</p>');
	});
});
