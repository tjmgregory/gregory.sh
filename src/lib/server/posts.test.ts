import { beforeEach, describe, expect, it, vi } from 'vitest';
import { middle, newer, older, postsKv } from './posts.fixtures';

const observeDatastore = vi.hoisted(() =>
	vi.fn((_platform: unknown, _operation: string, run: () => Promise<unknown>) => run())
);
vi.mock('$lib/health.server', () => ({ observeDatastore }));

const { listPosts, loadPostList, loadPostPage, readPost, renderPost, summaryOf, usesAssets } = await import(
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

	it('reads images, keeping only contract fields', async () => {
		const image = { url: 'https://assets.crafts.software/2026/11/a.jpg', width: 800, height: 600, color: '#8A7F72', alt: 'A desk' };
		const { kv } = postsKv({ 'post:building-inc': { ...older, images: [{ ...image, extra: 1 }] } });
		expect(await readPost(kv, 'building-inc')).toEqual({ ...older, images: [image] });
	});

	it('drops bad images and keeps the post', async () => {
		const good = { url: 'https://assets.crafts.software/2026/11/a.jpg', width: 800, height: 600 };
		const { kv } = postsKv({
			'post:building-inc': {
				...older,
				images: [good, { ...good, width: 0 }, { ...good, height: 1.5 }, { width: 1, height: 1 }, 'x']
			},
			'post:no-array': { ...older, slug: 'no-array', images: { url: good.url } },
			'post:bad-colour': { ...older, slug: 'bad-colour', images: [{ ...good, color: 'red', alt: 3 }] }
		});
		expect((await readPost(kv, 'building-inc'))?.images).toEqual([good]);
		expect(await readPost(kv, 'no-array')).toEqual({ ...older, slug: 'no-array' });
		expect((await readPost(kv, 'bad-colour'))?.images).toEqual([good]);
		const logged = vi.mocked(console.error).mock.calls.map(([message]) => String(message));
		expect(logged.filter((message) => message.includes('post:building-inc'))).toHaveLength(4);
		expect(logged.filter((message) => message.includes('post:no-array'))).toHaveLength(1);
	});
});

describe('readPost videos', () => {
	const video = {
		url: 'https://assets.crafts.software/2026/11/a.mp4',
		poster: 'https://assets.crafts.software/2026/11/a.jpg',
		width: 1280,
		height: 720
	};

	it('reads videos, keeping only contract fields', async () => {
		const full = { ...video, color: '#1A2B3C', durationMs: 4200, alt: 'A clip' };
		const { kv } = postsKv({ 'post:building-inc': { ...older, videos: [{ ...full, extra: 1 }] } });
		expect(await readPost(kv, 'building-inc')).toEqual({ ...older, videos: [full] });
	});

	it('reads a record without videos exactly as before', async () => {
		const { kv } = postsKv({ 'post:building-inc': { ...older, videos: null } });
		expect(await readPost(kv, 'building-inc')).toEqual(older);
	});

	it('drops bad videos and bad optional fields, and keeps the post', async () => {
		vi.mocked(console.error).mockClear();
		const { kv } = postsKv({
			'post:building-inc': {
				...older,
				videos: [
					video,
					{ ...video, poster: '' },
					{ ...video, poster: undefined },
					{ ...video, url: 3 },
					{ ...video, width: 0 },
					{ ...video, height: 2.5 },
					null
				]
			},
			'post:no-array': { ...older, slug: 'no-array', videos: { url: video.url } },
			'post:bad-fields': {
				...older,
				slug: 'bad-fields',
				videos: [{ ...video, color: 'red', durationMs: -1, alt: false }]
			}
		});
		expect((await readPost(kv, 'building-inc'))?.videos).toEqual([video]);
		expect(await readPost(kv, 'no-array')).toEqual({ ...older, slug: 'no-array' });
		expect((await readPost(kv, 'bad-fields'))?.videos).toEqual([video]);
		const logged = vi.mocked(console.error).mock.calls.map(([message]) => String(message));
		expect(logged.filter((message) => message.includes('post:building-inc'))).toHaveLength(6);
		expect(logged.filter((message) => message.includes('post:no-array'))).toHaveLength(1);
	});
});

describe('usesAssets', () => {
	const asset = (name: string) => `https://assets.crafts.software/2026/11/${name}`;

	it('is true when an image, a video or a poster is on the assets host', () => {
		expect(usesAssets(older)).toBe(false);
		expect(usesAssets({ ...older, images: [{ url: asset('a.jpg'), width: 1, height: 1 }] })).toBe(true);
		const video = { url: 'https://example.com/a.mp4', poster: 'https://example.com/a.jpg', width: 1, height: 1 };
		expect(usesAssets({ ...older, videos: [video] })).toBe(false);
		expect(usesAssets({ ...older, videos: [{ ...video, url: asset('a.mp4') }] })).toBe(true);
		expect(usesAssets({ ...older, videos: [{ ...video, poster: asset('a.jpg') }] })).toBe(true);
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
	it('renders markdown to the post HTML and re-renders when the markdown changes', async () => {
		expect(await renderPost(older)).toBe(
			'<p>Software is getting cheap. It’s <a href="/blog/inc">Inc</a>.</p>'
		);
		expect(await renderPost({ ...older, markdown: 'Edited.\n' })).toBe('<p>Edited.</p>');
	});

	it('re-renders when only the images change', async () => {
		const url = 'https://assets.crafts.software/2026/11/a.jpg';
		const post = { ...older, slug: 'with-image', markdown: `![A desk](${url})\n` };
		expect(await renderPost(post)).toBe(`<p><img src="${url}" alt="A desk"></p>`);
		expect(await renderPost({ ...post, images: [{ url, width: 800, height: 600 }] })).toContain(
			'width="800" height="600"'
		);
	});

	it('re-renders when only the videos change', async () => {
		const url = 'https://assets.crafts.software/2026/11/a.mp4';
		const post = { ...older, slug: 'with-video', markdown: `![A clip](${url})\n` };
		expect(await renderPost(post)).toBe(`<p><img src="${url}" alt="A clip"></p>`);
		const videos = [{ url, poster: 'https://assets.crafts.software/2026/11/a.jpg', width: 1280, height: 720 }];
		expect(await renderPost({ ...post, videos })).toContain('<video controls playsinline preload="metadata"');
	});
});

describe('summaryOf', () => {
	it('leaves out the markdown, the images and the videos', () => {
		const images = [{ url: 'https://assets.crafts.software/2026/11/a.jpg', width: 800, height: 600 }];
		const videos = [{ url: 'https://assets.crafts.software/2026/11/a.mp4', poster: images[0].url, width: 800, height: 600 }];
		expect(summaryOf({ ...older, images, videos })).toEqual({
			slug: older.slug,
			title: older.title,
			date: older.date,
			description: older.description
		});
	});
});
