import type { Component } from 'svelte';

export interface Post {
	slug: string;
	title: string;
	date: string;
	description: string;
	content: Component;
	keywords?: string[];
	seoTitle?: string;
	ogImage?: string;
	updated?: string;
}

export interface PostMetadata {
	slug: string;
	title: string;
	date: string;
	description: string;
	keywords?: string[];
	seoTitle?: string;
	ogImage?: string;
	updated?: string;
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
	const filenameSlug =
		path.split('/').pop()?.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? '';
	const slug =
		((module.metadata as Record<string, unknown>).slug as string) || filenameSlug;

	if (module.metadata) {
		postMap.set(slug, {
			slug,
			content: module.default,
			title: module.metadata.title,
			date: module.metadata.date,
			description: module.metadata.description,
			keywords: module.metadata.keywords,
			seoTitle: module.metadata.seoTitle,
			ogImage: module.metadata.ogImage,
			updated: module.metadata.updated
		});
	}
}

export function getPosts(): PostMetadata[] {
	const posts = Array.from(postMap.values()).map(
		({ slug, title, date, description, keywords, seoTitle, ogImage, updated }) => ({
			slug,
			title,
			date,
			description,
			keywords,
			seoTitle,
			ogImage,
			updated
		})
	);

	// Sort by date, newest first
	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | null {
	return postMap.get(slug) ?? null;
}
