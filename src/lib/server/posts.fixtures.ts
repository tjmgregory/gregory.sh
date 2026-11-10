/// <reference types="@cloudflare/workers-types" />
import { vi } from 'vitest';
import type { Post } from './posts';

export const newer: Post = {
	slug: 'parkinsons-law-testflight',
	title: 'I secretly added the signup page, then did nothing',
	date: '2026-08-06T08:00:00+01:00',
	description: "Then a friend reminded me about Parkinson's law.",
	keywords: ["parkinson's law"],
	seoTitle: "Parkinson's Law and the Beta I Kept Not Shipping",
	markdown: 'Back in July I added the signup page.\n'
};

export const older: Post = {
	slug: 'building-inc',
	title: 'Why I’m building a company made of agents',
	date: '2026-02-09T16:30:00.000Z',
	description: 'I’m building Inc.',
	markdown: "Software is getting cheap. It's [Inc](/blog/inc).\n"
};

export const middle: Post = {
	slug: 'human-friendly-skill',
	title: 'Just let me edit the plan',
	date: '2026-05-22T12:00:00+01:00',
	description: 'A small agent skill.',
	ogImage: 'https://assets.crafts.software/og/human-friendly-skill.png',
	markdown: '## Install\n'
};

export function contract(posts: Post[]): Record<string, unknown> {
	const entries: Record<string, unknown> = {};
	for (const post of posts) entries[`post:${post.slug}`] = post;
	entries.index = posts.map(({ markdown: _markdown, ...summary }) => summary);
	return entries;
}

export function postsKv(entries: Record<string, unknown> = contract([newer, middle, older])) {
	const get = vi.fn(async (key: string, _options?: unknown) =>
		key in entries ? structuredClone(entries[key]) : null
	);
	return { kv: { get } as unknown as KVNamespace, get };
}
