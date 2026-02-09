import type { Component } from 'svelte';

export interface Post {
	slug: string;
	title: string;
	date: string;
	description: string;
	content: Component;
}

export interface PostMetadata {
	slug: string;
	title: string;
	date: string;
	description: string;
}

interface PostModule {
	default: Component;
	metadata: Omit<PostMetadata, 'slug'>;
}

// Eager load all posts at build time
const modules = import.meta.glob<PostModule>('/content/posts/*.md', { eager: true });

// Build a map of slug -> post for quick lookup
const postMap = new Map<string, Post>();

for (const path in modules) {
	const module = modules[path];
	const slug = path.split('/').pop()?.replace('.md', '') ?? '';

	if (module.metadata) {
		postMap.set(slug, {
			slug,
			content: module.default,
			title: module.metadata.title,
			date: module.metadata.date,
			description: module.metadata.description
		});
	}
}

export function getPosts(): PostMetadata[] {
	const posts = Array.from(postMap.values()).map(({ slug, title, date, description }) => ({
		slug,
		title,
		date,
		description
	}));

	// Sort by date, newest first
	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | null {
	return postMap.get(slug) ?? null;
}
