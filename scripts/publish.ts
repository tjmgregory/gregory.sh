/**
 * Publish a blog post from the-newsroom draft to gregory.sh
 *
 * Takes a newsroom draft-blog.md file, validates its frontmatter,
 * transforms it to gregory.sh's content format, and places it
 * in content/posts/ ready for deployment.
 *
 * Usage:
 *   bun run publish <path-to-draft-blog.md>
 *   bun run publish <path-to-draft-blog.md> --dry-run
 *
 * The draft must have this frontmatter shape (matching the-newsroom drafts):
 *
 *   ---
 *   title: "Post Title"
 *   date: 2026-02-21T12:00:00+01:00
 *   description: "SEO meta description"
 *   slug: "post-slug"
 *   keywords:
 *     - "keyword one"
 *     - "keyword two"
 *   seoTitle: "Optional alternative title for search"   # optional
 *   ogImage: "/og/post-slug.png"                        # optional
 *   ---
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

interface DraftFrontmatter {
	title?: string;
	date?: string;
	description?: string;
	slug?: string;
	keywords?: string[];
	seoTitle?: string;
	ogImage?: string;
}

interface ValidatedFrontmatter {
	title: string;
	date: string;
	description: string;
	slug: string;
	keywords: string[];
	seoTitle?: string;
	ogImage?: string;
}

function usage(): never {
	console.error('Usage: bun run publish <path-to-draft-blog.md> [--dry-run]');
	process.exit(1);
}

function fail(msg: string): never {
	console.error(`✗ ${msg}`);
	process.exit(1);
}

function validate(data: DraftFrontmatter, content: string): ValidatedFrontmatter {
	const errors: string[] = [];

	if (!data.title?.trim()) errors.push('missing "title"');
	if (!data.date) errors.push('missing "date"');
	if (!data.description?.trim()) errors.push('missing "description"');
	if (!data.slug?.trim()) errors.push('missing "slug"');
	if (!data.keywords?.length) errors.push('missing "keywords" (need at least one)');
	if (!content.trim()) errors.push('draft body is empty');

	// Validate field quality
	if (data.title && data.title.length > 70) {
		errors.push(`title too long (${data.title.length} chars, max 70)`);
	}
	if (data.description && data.description.length > 160) {
		errors.push(`description too long (${data.description.length} chars, max 160)`);
	}
	if (data.description && data.description.length < 50) {
		errors.push(`description too short (${data.description.length} chars, min 50)`);
	}
	if (data.slug && /[A-Z]/.test(data.slug)) {
		errors.push(`slug contains uppercase characters: "${data.slug}"`);
	}
	if (data.slug && /[^a-z0-9-]/.test(data.slug)) {
		errors.push(`slug contains non-URL-safe characters: "${data.slug}"`);
	}

	// Validate date parses
	if (data.date) {
		const parsed = new Date(data.date);
		if (isNaN(parsed.getTime())) {
			errors.push(`date is not valid ISO format: "${data.date}"`);
		}
	}

	if (errors.length > 0) {
		console.error('✗ Frontmatter validation failed:\n');
		for (const e of errors) {
			console.error(`  - ${e}`);
		}
		console.error('\nExpected frontmatter shape:');
		console.error(`
---
title: "Post Title"
date: 2026-02-21T12:00:00+01:00
description: "SEO meta description (120-160 chars)"
slug: "post-slug"
keywords:
  - "primary keyword"
  - "secondary keyword"
seoTitle: "Optional SEO title override"
ogImage: "/og/post-slug.png"
---`);
		process.exit(1);
	}

	return {
		title: data.title!.trim(),
		date: data.date!,
		description: data.description!.trim(),
		slug: data.slug!.trim(),
		keywords: data.keywords!,
		...(data.seoTitle && { seoTitle: data.seoTitle }),
		...(data.ogImage && { ogImage: data.ogImage })
	};
}

function buildOutputFilename(date: string, slug: string): string {
	const d = new Date(date);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}-${slug}.md`;
}

function buildFrontmatter(meta: ValidatedFrontmatter): Record<string, unknown> {
	const fm: Record<string, unknown> = {
		title: meta.title,
		date: meta.date,
		description: meta.description,
		slug: meta.slug,
		keywords: meta.keywords
	};

	if (meta.seoTitle) fm.seoTitle = meta.seoTitle;
	if (meta.ogImage) fm.ogImage = meta.ogImage;

	return fm;
}

function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const filePath = args.find((a) => !a.startsWith('--'));

	if (!filePath) usage();

	const resolved = path.resolve(filePath);
	if (!fs.existsSync(resolved)) {
		fail(`file not found: ${resolved}`);
	}

	console.log(`Reading draft: ${resolved}\n`);

	const raw = fs.readFileSync(resolved, 'utf-8');
	// Extract the raw date string before gray-matter converts it to a Date object
	const rawDateMatch = raw.match(/^date:\s*["']?(.+?)["']?\s*$/m);
	const { data, content } = matter(raw);
	const meta = validate(data as DraftFrontmatter, content);

	// Preserve the original date string instead of gray-matter's Date object
	if (rawDateMatch) {
		meta.date = rawDateMatch[1];
	}

	const filename = buildOutputFilename(meta.date, meta.slug);
	const outputPath = path.join(POSTS_DIR, filename);

	// Check for existing post with same slug
	if (fs.existsSync(outputPath)) {
		fail(`post already exists: ${outputPath}\nDelete or rename the existing file to republish.`);
	}

	// Also check for any file with the same slug but different date
	const existingFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
	const conflicting = existingFiles.find((f) => f.endsWith(`-${meta.slug}.md`) && f !== filename);
	if (conflicting) {
		fail(
			`a post with slug "${meta.slug}" already exists as ${conflicting}\nDelete or rename the existing file to republish.`
		);
	}

	// Build the output file
	const fm = buildFrontmatter(meta);
	const output = matter.stringify(content, fm);

	console.log('Post details:');
	console.log(`  Title:       ${meta.title}`);
	console.log(`  Slug:        ${meta.slug}`);
	console.log(`  Date:        ${meta.date}`);
	console.log(`  Description: ${meta.description}`);
	console.log(`  Keywords:    ${meta.keywords.join(', ')}`);
	if (meta.seoTitle) console.log(`  SEO Title:   ${meta.seoTitle}`);
	if (meta.ogImage) console.log(`  OG Image:    ${meta.ogImage}`);
	console.log(`  File:        ${filename}`);
	console.log(`  Dest:        ${outputPath}`);
	console.log(`  Body:        ${content.trim().split('\n').length} lines\n`);

	if (dryRun) {
		console.log('DRY RUN — no files written.\n');
		console.log('Output preview (first 20 lines):');
		console.log('---');
		const lines = output.split('\n').slice(0, 20);
		console.log(lines.join('\n'));
		console.log('---');
		return;
	}

	// Ensure posts directory exists
	fs.mkdirSync(POSTS_DIR, { recursive: true });

	// Write the post
	fs.writeFileSync(outputPath, output, 'utf-8');
	console.log(`✓ Published to ${outputPath}`);

	// Suggest next steps
	console.log('\nNext steps:');
	console.log(`  bun run seo:validate          # Check SEO compliance`);
	console.log(`  bun run og:generate            # Generate OG image`);
	console.log(`  bun run build                  # Verify build succeeds`);
}

main();
