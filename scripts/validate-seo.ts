/**
 * SEO Validation Script
 *
 * Validates posts meet SEO requirements. Exits with code 1 if issues found.
 * Used in CI to enforce SEO standards on PRs.
 *
 * Usage:
 *   bun run seo:validate
 *   bun run seo:validate --strict  # Also fail on warnings
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

interface PostFrontmatter {
	title: string;
	date: string;
	description?: string;
}

interface ValidationResult {
	file: string;
	errors: string[];
	warnings: string[];
}

function parseArgs() {
	return {
		strict: process.argv.includes('--strict')
	};
}

function fileToSlug(file: string): string {
	return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

function findImages(content: string) {
	const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	const matches: Array<{ alt: string; src: string }> = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		matches.push({ alt: match[1], src: match[2] });
	}
	return matches;
}

function findHeadings(content: string) {
	const regex = /^(#{1,6})\s+(.+)$/gm;
	const matches: Array<{ level: number; text: string }> = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		matches.push({ level: match[1].length, text: match[2].trim() });
	}
	return matches;
}

function validatePost(file: string, frontmatter: PostFrontmatter, content: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const slug = fileToSlug(file);

	// REQ-001: Must have description
	if (!frontmatter.description?.trim()) {
		errors.push('Missing meta description (run: bun run seo:generate)');
	} else if (frontmatter.description.length < 120) {
		warnings.push(`Description too short (${frontmatter.description.length} chars, aim for 120-160)`);
	} else if (frontmatter.description.length > 160) {
		warnings.push(`Description too long (${frontmatter.description.length} chars, aim for 120-160)`);
	}

	// REQ-003: Images must have alt text
	const images = findImages(content);
	const missingAlt = images.filter((img) => !img.alt && !img.alt.trim());
	if (missingAlt.length > 0) {
		errors.push(`${missingAlt.length} image(s) missing alt text (run: bun run seo:generate)`);
	}

	// REQ-007: Title length
	if (frontmatter.title.length > 60) {
		warnings.push(`Title too long (${frontmatter.title.length} chars, max 60)`);
	} else if (frontmatter.title.length < 30) {
		warnings.push(`Title short (${frontmatter.title.length} chars, consider 30-60)`);
	}

	// REQ-009: Heading hierarchy
	const headings = findHeadings(content);
	const h1s = headings.filter((h) => h.level === 1);
	if (h1s.length === 0) {
		warnings.push('Missing H1 heading');
	} else if (h1s.length > 1) {
		warnings.push(`Multiple H1 headings (${h1s.length})`);
	}

	for (let i = 1; i < headings.length; i++) {
		const prev = headings[i - 1];
		const curr = headings[i];
		if (curr.level > prev.level + 1) {
			warnings.push(`Skipped heading level: H${prev.level} → H${curr.level}`);
		}
	}

	// REQ-010: OG image should exist
	const ogPath = path.join(process.cwd(), 'static/og', `${slug}.png`);
	if (!fs.existsSync(ogPath)) {
		warnings.push(`Missing OG image (run: bun run og:generate)`);
	}

	return { file, errors, warnings };
}

function main() {
	const args = parseArgs();

	if (!fs.existsSync(POSTS_DIR)) {
		console.log('No posts directory found');
		process.exit(0);
	}

	const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));

	if (files.length === 0) {
		console.log('No posts found');
		process.exit(0);
	}

	console.log(`Validating ${files.length} post(s)...\n`);

	let totalErrors = 0;
	let totalWarnings = 0;

	for (const file of files) {
		const filepath = path.join(POSTS_DIR, file);
		const raw = fs.readFileSync(filepath, 'utf-8');
		const { data, content } = matter(raw);
		const frontmatter = data as PostFrontmatter;

		const result = validatePost(file, frontmatter, content);

		if (result.errors.length > 0 || result.warnings.length > 0) {
			console.log(`━━━ ${file} ━━━`);

			for (const error of result.errors) {
				console.log(`  ✗ ${error}`);
				totalErrors++;
			}

			for (const warning of result.warnings) {
				console.log(`  ⚠ ${warning}`);
				totalWarnings++;
			}

			console.log('');
		}
	}

	console.log(`━━━ Summary ━━━`);
	console.log(`Errors: ${totalErrors}`);
	console.log(`Warnings: ${totalWarnings}`);

	if (totalErrors > 0) {
		console.log('\n✗ Validation failed');
		process.exit(1);
	}

	if (args.strict && totalWarnings > 0) {
		console.log('\n✗ Validation failed (strict mode)');
		process.exit(1);
	}

	console.log('\n✓ Validation passed');
}

main();
