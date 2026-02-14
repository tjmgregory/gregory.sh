/**
 * SEO Generation & Validation Script
 *
 * Analyzes posts for SEO issues and generates missing content.
 *
 * Usage:
 *   bun run seo:generate           # Generate and write
 *   bun run seo:generate --dry-run # Preview without writing
 *
 * Requires: OPENAI_API_KEY environment variable
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import OpenAI from 'openai';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

interface PostFrontmatter {
	title: string;
	date: string;
	description?: string;
	keywords?: string[];
	seoTitle?: string;
	ogImage?: string;
	updated?: string;
	slug?: string;
}

interface Post {
	file: string;
	slug: string;
	frontmatter: PostFrontmatter;
	content: string;
}

interface ImageMatch {
	full: string;
	alt: string;
	src: string;
	index: number;
}

interface HeadingMatch {
	level: number;
	text: string;
	index: number;
}

interface LinkSuggestion {
	targetSlug: string;
	targetTitle: string;
	anchorText: string;
	reason: string;
}

interface PostIssues {
	missingDescription: boolean;
	titleTooLong: boolean;
	titleTooShort: boolean;
	imagesWithoutAlt: ImageMatch[];
	headingIssues: string[];
}

interface Args {
	dryRun: boolean;
}

function parseArgs(): Args {
	return {
		dryRun: process.argv.includes('--dry-run')
	};
}

// Extract slug from filename (e.g., "2026-02-09-building-inc.md" -> "building-inc")
function fileToSlug(file: string): string {
	return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

// Parse markdown for images: ![alt](src)
function findImages(content: string): ImageMatch[] {
	const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	const matches: ImageMatch[] = [];
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
function findHeadings(content: string): HeadingMatch[] {
	const regex = /^(#{1,6})\s+(.+)$/gm;
	const matches: HeadingMatch[] = [];
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

// Check if post already links to another post
function hasLinkTo(content: string, slug: string): boolean {
	const linkPattern = new RegExp(`\\(/blog/${slug}\\)|\\(/${slug}\\)|\\(/posts/${slug}\\)`, 'i');
	return linkPattern.test(content);
}

// Validate heading hierarchy (REQ-009)
function validateHeadings(headings: HeadingMatch[]): string[] {
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

// Analyze a post for SEO issues
function analyzePost(frontmatter: PostFrontmatter, content: string): PostIssues {
	const images = findImages(content);
	const headings = findHeadings(content);

	return {
		missingDescription: !frontmatter.description?.trim(),
		titleTooLong: frontmatter.title.length > 60,
		titleTooShort: frontmatter.title.length < 30,
		imagesWithoutAlt: images.filter((img) => !img.alt.trim()),
		headingIssues: validateHeadings(headings)
	};
}

// Generate meta description (REQ-001)
async function generateDescription(
	openai: OpenAI,
	title: string,
	content: string
): Promise<string> {
	const response = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You write meta descriptions for blog posts. Requirements:
- 120-160 characters (strict limit)
- Include the primary topic/keyword
- Compelling and click-worthy
- No fluff or filler words
- Written in first person if the post is first person
- Do not start with "This post" or "In this article"

Return ONLY the meta description, no quotes or explanation.`
			},
			{
				role: 'user',
				content: `Title: ${title}\n\nContent:\n${content.slice(0, 2000)}`
			}
		],
		max_tokens: 100,
		temperature: 0.7
	});

	return response.choices[0]?.message?.content?.trim() ?? '';
}

// Generate image alt text (REQ-003)
async function generateAltText(
	openai: OpenAI,
	imageSrc: string,
	surroundingContent: string
): Promise<string> {
	const response = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You write alt text for images in blog posts. Requirements:
- Describe what the image likely shows based on filename and context
- Be concise (under 125 characters)
- Be descriptive and contextual, not just the filename
- If it seems decorative, return exactly: DECORATIVE

Return ONLY the alt text, no quotes or explanation.`
			},
			{
				role: 'user',
				content: `Image filename: ${imageSrc}\n\nSurrounding content:\n${surroundingContent}`
			}
		],
		max_tokens: 50,
		temperature: 0.5
	});

	return response.choices[0]?.message?.content?.trim() ?? '';
}

// Suggest internal links (REQ-004)
async function suggestInternalLinks(
	openai: OpenAI,
	post: Post,
	allPosts: Post[]
): Promise<LinkSuggestion[]> {
	// Filter out self and already-linked posts
	const candidates = allPosts.filter(
		(p) => p.slug !== post.slug && !hasLinkTo(post.content, p.slug)
	);

	if (candidates.length === 0) return [];

	const postList = candidates.map((p) => `- "${p.frontmatter.title}" (slug: ${p.slug})`).join('\n');

	const response = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You suggest internal links for blog posts. Given a post and a list of other posts, identify 0-3 relevant linking opportunities.

For each suggestion, provide:
1. The target post slug
2. Suggested anchor text (2-5 words from the source post that could become a link)
3. Brief reason why they're related

Return JSON array: [{"slug": "...", "anchor": "...", "reason": "..."}]
If no good links, return: []

Only suggest links that make semantic sense. Don't force connections.`
			},
			{
				role: 'user',
				content: `Current post title: ${post.frontmatter.title}

Current post content (excerpt):
${post.content.slice(0, 1500)}

Available posts to link to:
${postList}`
			}
		],
		max_tokens: 300,
		temperature: 0.3
	});

	const text = response.choices[0]?.message?.content?.trim() ?? '[]';

	try {
		const suggestions = JSON.parse(text) as Array<{ slug: string; anchor: string; reason: string }>;
		return suggestions.map((s) => {
			const target = candidates.find((c) => c.slug === s.slug);
			return {
				targetSlug: s.slug,
				targetTitle: target?.frontmatter.title ?? s.slug,
				anchorText: s.anchor,
				reason: s.reason
			};
		});
	} catch {
		return [];
	}
}

// Load all posts
function loadPosts(): Post[] {
	if (!fs.existsSync(POSTS_DIR)) return [];

	const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));

	return files.map((file) => {
		const filepath = path.join(POSTS_DIR, file);
		const raw = fs.readFileSync(filepath, 'utf-8');
		const { data, content } = matter(raw);
		return {
			file,
			slug: fileToSlug(file),
			frontmatter: data as PostFrontmatter,
			content
		};
	});
}

async function main() {
	const args = parseArgs();

	if (args.dryRun) {
		console.log('DRY RUN - no files will be modified\n');
	}

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error('Error: OPENAI_API_KEY environment variable required');
		process.exit(1);
	}

	const openai = new OpenAI({ apiKey });

	const posts = loadPosts();
	if (posts.length === 0) {
		console.log(`No posts found in ${POSTS_DIR}`);
		return;
	}

	console.log(`Found ${posts.length} post(s)\n`);

	const stats = {
		descriptionsGenerated: 0,
		altTextGenerated: 0,
		titleWarnings: 0,
		headingWarnings: 0,
		linkSuggestions: 0
	};

	for (const post of posts) {
		console.log(`\n━━━ ${post.file} ━━━`);

		const filepath = path.join(POSTS_DIR, post.file);
		const issues = analyzePost(post.frontmatter, post.content);
		let modified = false;
		let updatedContent = post.content;

		// REQ-007: Title validation
		if (issues.titleTooLong) {
			console.log(`  ⚠ Title too long (${post.frontmatter.title.length} chars, max 60)`);
			stats.titleWarnings++;
		} else if (issues.titleTooShort) {
			console.log(`  ⚠ Title short (${post.frontmatter.title.length} chars, consider 30-60)`);
			stats.titleWarnings++;
		} else {
			console.log(`  ✓ Title length OK (${post.frontmatter.title.length} chars)`);
		}

		// REQ-009: Heading hierarchy
		if (issues.headingIssues.length > 0) {
			for (const issue of issues.headingIssues) {
				console.log(`  ⚠ ${issue}`);
				stats.headingWarnings++;
			}
		} else {
			console.log(`  ✓ Heading hierarchy OK`);
		}

		// REQ-001: Description generation
		if (issues.missingDescription) {
			console.log(`  → Generating description...`);
			const description = await generateDescription(openai, post.frontmatter.title, post.content);

			if (description) {
				console.log(`    "${description}" (${description.length} chars)`);
				post.frontmatter.description = description;
				modified = true;
				stats.descriptionsGenerated++;
			} else {
				console.log(`    ✗ Failed to generate`);
			}
		} else {
			console.log(`  ✓ Has description`);
		}

		// REQ-003: Image alt text
		if (issues.imagesWithoutAlt.length > 0) {
			console.log(`  → ${issues.imagesWithoutAlt.length} image(s) missing alt text`);

			for (const img of issues.imagesWithoutAlt) {
				const start = Math.max(0, img.index - 200);
				const end = Math.min(post.content.length, img.index + 200);
				const surrounding = post.content.slice(start, end);

				const altText = await generateAltText(openai, img.src, surrounding);

				if (altText === 'DECORATIVE') {
					console.log(`    ${img.src} → "" (decorative)`);
					updatedContent = updatedContent.replace(img.full, `![](${img.src})`);
				} else if (altText) {
					console.log(`    ${img.src} → "${altText}"`);
					updatedContent = updatedContent.replace(img.full, `![${altText}](${img.src})`);
					stats.altTextGenerated++;
				}
				modified = true;
			}
		} else {
			const totalImages = findImages(post.content).length;
			if (totalImages > 0) {
				console.log(`  ✓ All ${totalImages} image(s) have alt text`);
			}
		}

		// REQ-004: Internal linking suggestions (only if multiple posts)
		if (posts.length > 1) {
			const suggestions = await suggestInternalLinks(openai, post, posts);
			if (suggestions.length > 0) {
				console.log(`  💡 Internal link suggestions:`);
				for (const s of suggestions) {
					console.log(`    → Link "${s.anchorText}" to "${s.targetTitle}"`);
					console.log(`      /blog/${s.targetSlug} (${s.reason})`);
					stats.linkSuggestions++;
				}
			}
		}

		// Write changes
		if (modified && !args.dryRun) {
			const updated = matter.stringify(updatedContent, post.frontmatter);
			fs.writeFileSync(filepath, updated);
			console.log(`  ✓ Written`);
		} else if (modified) {
			console.log(`  ⊘ Dry run, not written`);
		}
	}

	console.log(`\n━━━ Summary ━━━`);
	console.log(`Descriptions generated: ${stats.descriptionsGenerated}`);
	console.log(`Alt text generated: ${stats.altTextGenerated}`);
	console.log(`Title warnings: ${stats.titleWarnings}`);
	console.log(`Heading warnings: ${stats.headingWarnings}`);
	console.log(`Link suggestions: ${stats.linkSuggestions}`);
}

main().catch(console.error);
