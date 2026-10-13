import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import matter from 'gray-matter';
import { ideas, ideaGroups, workTools } from './ideas';

describe('ideas catalogue', () => {
	it('keeps a complete, unique entry in a known group for each idea', () => {
		expect(ideas).toHaveLength(9);
		expect(new Set(ideas.map((idea) => idea.name)).size).toBe(ideas.length);
		for (const idea of ideas) {
			expect(ideaGroups).toContain(idea.group);
			expect(idea.name.trim()).not.toBe('');
			expect(idea.description.trim()).not.toBe('');
			expect(idea.meta.trim()).not.toBe('');
			if (idea.link) {
				expect(new URL(idea.link.href).protocol).toBe('https:');
				expect(idea.link.label.trim()).not.toBe('');
			}
		}
	});

	it('links work tools to published frontmatter slugs', () => {
		const slugs = globSync('content/posts/**/*.md').map(
			(path) => matter(readFileSync(path, 'utf8')).data.slug
		);
		for (const tool of workTools) expect(slugs).toContain(tool.slug);
	});

	it('keeps the public beta destination and avoids invented links for research ideas', () => {
		expect(ideas.find((idea) => idea.name === 'Lanteon')?.link?.href).toBe(
			'https://testflight.apple.com/join/YWvVFWj6'
		);
		for (const name of ['CasualComp', 'Cognoscenti', 'Memreez', 'Pengua']) {
			expect(ideas.find((idea) => idea.name === name)?.link).toBeUndefined();
		}
	});
});
