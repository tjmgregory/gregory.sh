/// <reference types="@cloudflare/workers-types" />
import { observeDatastore } from '$lib/health.server';

// Contract with the newsroom: docs/unified-process/architecture/ADR-003-posts-from-kv.md

export interface PostSummary {
	slug: string;
	title: string;
	date: string;
	description: string;
	keywords?: string[];
	seoTitle?: string;
	ogImage?: string;
	updated?: string;
}

export interface PostImage {
	url: string;
	width: number;
	height: number;
	color?: string;
	alt?: string;
}

export interface Post extends PostSummary {
	markdown: string;
	images?: PostImage[];
}

// KV's minimum. With the 30s page cache, a new post shows within about a minute.
const KV_CACHE_TTL_SECONDS = 30;

// adapter-cloudflare keeps responses with Cache-Control in the Cache API, which
// honours s-maxage but not stale-while-revalidate. max-age=0 stops browsers adding delay.
export const POSTS_CACHE_CONTROL = 'public, max-age=0, s-maxage=30';

// KV throws on a longer key, which would count against /healthz.
const MAX_KEY_BYTES = 512;
const encoder = new TextEncoder();

function optionalString(value: unknown): string | undefined | false {
	if (value === undefined || value === null) return undefined;
	return typeof value === 'string' ? value : false;
}

function toSummary(value: unknown): PostSummary | null {
	if (typeof value !== 'object' || value === null) return null;
	const record = value as Record<string, unknown>;
	const { slug, title, date, description } = record;
	if (typeof slug !== 'string' || slug === '') return null;
	if (typeof title !== 'string' || typeof description !== 'string') return null;
	if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) return null;

	const keywords = record.keywords ?? undefined;
	if (keywords !== undefined && !(Array.isArray(keywords) && keywords.every((k) => typeof k === 'string'))) {
		return null;
	}
	const seoTitle = optionalString(record.seoTitle);
	const ogImage = optionalString(record.ogImage);
	const updated = optionalString(record.updated);
	if (seoTitle === false || ogImage === false || updated === false) return null;

	return {
		slug,
		title,
		date,
		description,
		...(keywords !== undefined && { keywords: keywords as string[] }),
		...(seoTitle !== undefined && { seoTitle }),
		...(ogImage !== undefined && { ogImage }),
		...(updated !== undefined && { updated })
	};
}

export const ASSETS_ORIGIN = 'https://assets.crafts.software/';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isPixels(value: unknown): value is number {
	return Number.isInteger(value) && (value as number) > 0;
}

function toImage(value: unknown): PostImage | null {
	if (typeof value !== 'object' || value === null) return null;
	const { url, width, height, color, alt } = value as Record<string, unknown>;
	if (typeof url !== 'string' || url === '' || !isPixels(width) || !isPixels(height)) return null;
	return {
		url,
		width,
		height,
		...(typeof color === 'string' && HEX_COLOR.test(color) && { color }),
		...(typeof alt === 'string' && { alt })
	};
}

function toImages(value: unknown, slug: string): PostImage[] | undefined {
	if (value === undefined || value === null) return undefined;
	if (!Array.isArray(value)) {
		console.error(`Ignoring "images" on post:${slug}: not an array`, value);
		return undefined;
	}
	const images: PostImage[] = [];
	for (const entry of value) {
		const image = toImage(entry);
		if (image) images.push(image);
		else console.error(`Skipping an image on post:${slug} that does not match the contract`, entry);
	}
	return images.length ? images : undefined;
}

function newestFirst(a: PostSummary, b: PostSummary): number {
	return Date.parse(b.date) - Date.parse(a.date);
}

export async function listPosts(kv: KVNamespace): Promise<PostSummary[]> {
	const index = await kv.get<unknown>('index', { type: 'json', cacheTtl: KV_CACHE_TTL_SECONDS });
	if (index === null) return [];
	if (!Array.isArray(index)) throw new Error('KV "index" is not an array of posts');

	const posts: PostSummary[] = [];
	for (const entry of index) {
		const post = toSummary(entry);
		if (post) posts.push(post);
		else console.error('Skipping a posts index entry that does not match the contract', entry);
	}
	return posts.sort(newestFirst);
}

export async function readPost(kv: KVNamespace, slug: string): Promise<Post | null> {
	const key = `post:${slug}`;
	if (slug === '' || encoder.encode(key).byteLength > MAX_KEY_BYTES) return null;
	const value = await kv.get<unknown>(key, { type: 'json', cacheTtl: KV_CACHE_TTL_SECONDS });
	if (value === null) return null;

	const summary = toSummary(value);
	const markdown = (value as { markdown?: unknown }).markdown;
	if (!summary || summary.slug !== slug || typeof markdown !== 'string') {
		throw new Error(`KV "post:${slug}" does not match the posts contract`);
	}
	const images = toImages((value as { images?: unknown }).images, slug);
	return { ...summary, markdown, ...(images && { images }) };
}

function postsNamespace(platform: App.Platform | undefined): KVNamespace {
	const kv = platform?.env?.POSTS;
	if (!kv) throw new Error('POSTS binding unavailable');
	return kv;
}

export async function loadPostList(platform: App.Platform | undefined): Promise<PostSummary[]> {
	const kv = postsNamespace(platform);
	return observeDatastore(platform, 'posts-get', () => listPosts(kv));
}

export async function loadPostPage(
	platform: App.Platform | undefined,
	slug: string
): Promise<{ post: Post | null; posts: PostSummary[] }> {
	const kv = postsNamespace(platform);
	const [post, posts] = await observeDatastore(platform, 'posts-get', () =>
		Promise.all([readPost(kv, slug), listPosts(kv)])
	);
	return { post, posts };
}

const RENDER_CACHE_LIMIT = 100;
const rendered = new Map<string, { markdown: string; images: string; html: string }>();

// Imported here, not at the top, so pages that only list posts never load the renderer.
export async function renderPost(post: Post): Promise<string> {
	const images = JSON.stringify(post.images ?? []);
	const cached = rendered.get(post.slug);
	if (cached?.markdown === post.markdown && cached.images === images) return cached.html;

	const { renderMarkdown } = await import('./markdown');
	const html = renderMarkdown(post.markdown, post.images);
	if (!cached && rendered.size >= RENDER_CACHE_LIMIT) {
		rendered.delete(rendered.keys().next().value as string);
	}
	rendered.set(post.slug, { markdown: post.markdown, images, html });
	return html;
}

export function summaryOf({ markdown: _markdown, images: _images, ...summary }: Post): PostSummary {
	return summary;
}
