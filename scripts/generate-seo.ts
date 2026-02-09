/**
 * SEO Generation Script
 *
 * Generates meta descriptions for posts missing them.
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
}

interface Args {
	dryRun: boolean;
}

function parseArgs(): Args {
	return {
		dryRun: process.argv.includes('--dry-run')
	};
}

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

	if (!fs.existsSync(POSTS_DIR)) {
		console.log(`No posts directory at ${POSTS_DIR}`);
		return;
	}

	const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));
	console.log(`Found ${files.length} post(s)\n`);

	let generated = 0;
	let skipped = 0;

	for (const file of files) {
		const filepath = path.join(POSTS_DIR, file);
		const raw = fs.readFileSync(filepath, 'utf-8');
		const { data, content } = matter(raw);
		const frontmatter = data as PostFrontmatter;

		if (frontmatter.description?.trim()) {
			console.log(`✓ ${file} — has description, skipping`);
			skipped++;
			continue;
		}

		console.log(`→ ${file} — generating description...`);

		const description = await generateDescription(openai, frontmatter.title, content);

		if (!description) {
			console.log(`  ✗ Failed to generate description`);
			continue;
		}

		console.log(`  "${description}" (${description.length} chars)`);

		if (!args.dryRun) {
			frontmatter.description = description;
			const updated = matter.stringify(content, frontmatter);
			fs.writeFileSync(filepath, updated);
			console.log(`  ✓ Written to ${file}`);
		} else {
			console.log(`  ⊘ Dry run, not written`);
		}

		generated++;
	}

	console.log(`\nDone: ${generated} generated, ${skipped} skipped`);
}

main().catch(console.error);
