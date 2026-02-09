/**
 * Tests for SEO generation utilities
 */

import { describe, it, expect } from 'vitest';

// Import utility functions (we'll need to export them from the main script)
// For now, we'll inline the functions here for testing

// Parse markdown for images: ![alt](src)
function findImages(content: string) {
	const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	const matches: Array<{ full: string; alt: string; src: string; index: number }> = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		matches.push({
			full: match[0],
			alt: match[1],
			src: match[2],
			index: match.index
		});
	}
	return matches;
}

// Parse markdown for headings
function findHeadings(content: string) {
	const regex = /^(#{1,6})\s+(.+)$/gm;
	const matches: Array<{ level: number; text: string; index: number }> = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		matches.push({
			level: match[1].length,
			text: match[2].trim(),
			index: match.index
		});
	}
	return matches;
}

// Validate heading hierarchy
function validateHeadings(headings: Array<{ level: number; text: string }>) {
	const issues: string[] = [];

	const h1s = headings.filter((h) => h.level === 1);
	if (h1s.length === 0) {
		issues.push('Missing H1 heading');
	} else if (h1s.length > 1) {
		issues.push(`Multiple H1 headings (${h1s.length})`);
	}

	for (let i = 1; i < headings.length; i++) {
		const prev = headings[i - 1];
		const curr = headings[i];
		if (curr.level > prev.level + 1) {
			issues.push(`Skipped heading level: H${prev.level} → H${curr.level} ("${curr.text}")`);
		}
	}

	return issues;
}

// Check if post links to another post
function hasLinkTo(content: string, slug: string): boolean {
	const linkPattern = new RegExp(`\\(/blog/${slug}\\)|\\(/${slug}\\)|\\(/posts/${slug}\\)`, 'i');
	return linkPattern.test(content);
}

// Extract slug from filename
function fileToSlug(file: string): string {
	return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

describe('findImages', () => {
	it('finds images with alt text', () => {
		const content = 'Some text ![Alt text](image.png) more text';
		const images = findImages(content);
		expect(images).toHaveLength(1);
		expect(images[0].alt).toBe('Alt text');
		expect(images[0].src).toBe('image.png');
	});

	it('finds images without alt text', () => {
		const content = 'Text ![](empty-alt.png) here';
		const images = findImages(content);
		expect(images).toHaveLength(1);
		expect(images[0].alt).toBe('');
		expect(images[0].src).toBe('empty-alt.png');
	});

	it('finds multiple images', () => {
		const content = '![One](1.png) text ![Two](2.png) ![](3.png)';
		const images = findImages(content);
		expect(images).toHaveLength(3);
	});

	it('returns empty array for no images', () => {
		const content = 'Just plain text with no images';
		const images = findImages(content);
		expect(images).toHaveLength(0);
	});

	it('handles URLs in image src', () => {
		const content = '![Logo](https://example.com/logo.png)';
		const images = findImages(content);
		expect(images[0].src).toBe('https://example.com/logo.png');
	});
});

describe('findHeadings', () => {
	it('finds H1 headings', () => {
		const content = '# Main Title\n\nSome text';
		const headings = findHeadings(content);
		expect(headings).toHaveLength(1);
		expect(headings[0].level).toBe(1);
		expect(headings[0].text).toBe('Main Title');
	});

	it('finds multiple heading levels', () => {
		const content = '# H1\n## H2\n### H3\n#### H4';
		const headings = findHeadings(content);
		expect(headings).toHaveLength(4);
		expect(headings.map((h) => h.level)).toEqual([1, 2, 3, 4]);
	});

	it('ignores non-heading # characters', () => {
		const content = 'Text with #hashtag\n# Real Heading';
		const headings = findHeadings(content);
		expect(headings).toHaveLength(1);
		expect(headings[0].text).toBe('Real Heading');
	});

	it('returns empty for no headings', () => {
		const content = 'Just plain paragraph text.';
		const headings = findHeadings(content);
		expect(headings).toHaveLength(0);
	});
});

describe('validateHeadings', () => {
	it('passes valid hierarchy', () => {
		const headings = [
			{ level: 1, text: 'H1' },
			{ level: 2, text: 'H2' },
			{ level: 3, text: 'H3' },
			{ level: 2, text: 'Another H2' }
		];
		const issues = validateHeadings(headings);
		expect(issues).toHaveLength(0);
	});

	it('detects missing H1', () => {
		const headings = [
			{ level: 2, text: 'H2' },
			{ level: 3, text: 'H3' }
		];
		const issues = validateHeadings(headings);
		expect(issues).toContain('Missing H1 heading');
	});

	it('detects multiple H1s', () => {
		const headings = [
			{ level: 1, text: 'First H1' },
			{ level: 2, text: 'H2' },
			{ level: 1, text: 'Second H1' }
		];
		const issues = validateHeadings(headings);
		expect(issues).toContain('Multiple H1 headings (2)');
	});

	it('detects skipped levels', () => {
		const headings = [
			{ level: 1, text: 'H1' },
			{ level: 3, text: 'H3 - skipped H2' }
		];
		const issues = validateHeadings(headings);
		expect(issues.some((i) => i.includes('Skipped heading level'))).toBe(true);
	});

	it('allows jumping back up levels', () => {
		const headings = [
			{ level: 1, text: 'H1' },
			{ level: 2, text: 'H2' },
			{ level: 3, text: 'H3' },
			{ level: 2, text: 'Back to H2' }
		];
		const issues = validateHeadings(headings);
		expect(issues).toHaveLength(0);
	});
});

describe('hasLinkTo', () => {
	it('detects /blog/ links', () => {
		const content = 'Check out [this post](/blog/other-post) for more.';
		expect(hasLinkTo(content, 'other-post')).toBe(true);
	});

	it('detects /posts/ links', () => {
		const content = 'See [here](/posts/another-post).';
		expect(hasLinkTo(content, 'another-post')).toBe(true);
	});

	it('returns false for no link', () => {
		const content = 'No links to any posts here.';
		expect(hasLinkTo(content, 'some-post')).toBe(false);
	});

	it('is case insensitive', () => {
		const content = 'Link to [Post](/Blog/My-Post).';
		expect(hasLinkTo(content, 'my-post')).toBe(true);
	});
});

describe('fileToSlug', () => {
	it('removes date prefix and extension', () => {
		expect(fileToSlug('2026-02-09-building-inc.md')).toBe('building-inc');
	});

	it('handles files without date prefix', () => {
		expect(fileToSlug('about.md')).toBe('about');
	});

	it('handles complex slugs', () => {
		expect(fileToSlug('2026-01-15-my-awesome-post-title.md')).toBe('my-awesome-post-title');
	});
});
