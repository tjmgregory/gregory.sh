/**
 * OG Image Generation Script (REQ-010)
 *
 * Generates Open Graph images for posts missing them.
 *
 * Usage:
 *   bun run og:generate           # Generate images
 *   bun run og:generate --dry-run # Preview without writing
 *
 * Output: static/og/<slug>.png (1200x630)
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const OG_OUTPUT_DIR = path.join(process.cwd(), 'static/og');

interface PostFrontmatter {
	title: string;
	date: string;
	description?: string;
	ogImage?: string;
}

interface Args {
	dryRun: boolean;
	force: boolean;
}

function parseArgs(): Args {
	return {
		dryRun: process.argv.includes('--dry-run'),
		force: process.argv.includes('--force')
	};
}

function fileToSlug(file: string): string {
	return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

// Load a font for satori (using Inter from Google Fonts CDN)
async function loadFont(): Promise<ArrayBuffer> {
	const fontUrl =
		'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';
	const response = await fetch(fontUrl);
	return response.arrayBuffer();
}

// Generate OG image SVG using satori
async function generateOgImage(
	title: string,
	fontData: ArrayBuffer
): Promise<Buffer> {
	// Truncate long titles
	const displayTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'flex-start',
					padding: '80px',
					background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
					fontFamily: 'Inter'
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								fontSize: '64px',
								fontWeight: 700,
								color: '#ffffff',
								lineHeight: 1.2,
								marginBottom: '40px',
								maxWidth: '900px'
							},
							children: displayTitle
						}
					},
					{
						type: 'div',
						props: {
							style: {
								fontSize: '32px',
								color: '#94a3b8',
								display: 'flex',
								alignItems: 'center',
								gap: '12px'
							},
							children: [
								{
									type: 'span',
									props: {
										children: 'gregory.sh'
									}
								}
							]
						}
					}
				]
			}
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'Inter',
					data: fontData,
					weight: 400,
					style: 'normal'
				},
				{
					name: 'Inter',
					data: fontData,
					weight: 700,
					style: 'normal'
				}
			]
		}
	);

	// Convert SVG to PNG
	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: 1200
		}
	});

	return resvg.render().asPng();
}

async function main() {
	const args = parseArgs();

	if (args.dryRun) {
		console.log('DRY RUN - no files will be written\n');
	}

	// Ensure output directory exists
	if (!args.dryRun && !fs.existsSync(OG_OUTPUT_DIR)) {
		fs.mkdirSync(OG_OUTPUT_DIR, { recursive: true });
	}

	if (!fs.existsSync(POSTS_DIR)) {
		console.log(`No posts directory at ${POSTS_DIR}`);
		return;
	}

	console.log('Loading font...');
	const fontData = await loadFont();

	const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));
	console.log(`Found ${files.length} post(s)\n`);

	let generated = 0;
	let skipped = 0;

	for (const file of files) {
		const slug = fileToSlug(file);
		const outputPath = path.join(OG_OUTPUT_DIR, `${slug}.png`);

		const filepath = path.join(POSTS_DIR, file);
		const raw = fs.readFileSync(filepath, 'utf-8');
		const { data } = matter(raw);
		const frontmatter = data as PostFrontmatter;

		// Skip if image already exists (unless --force)
		if (fs.existsSync(outputPath) && !args.force) {
			console.log(`✓ ${slug}.png exists, skipping`);
			skipped++;
			continue;
		}

		console.log(`→ Generating ${slug}.png...`);

		const png = await generateOgImage(frontmatter.title, fontData);

		if (!args.dryRun) {
			fs.writeFileSync(outputPath, png);
			console.log(`  ✓ Written (${(png.length / 1024).toFixed(1)} KB)`);
		} else {
			console.log(`  ⊘ Dry run, would write ${(png.length / 1024).toFixed(1)} KB`);
		}

		generated++;
	}

	console.log(`\nDone: ${generated} generated, ${skipped} skipped`);
}

main().catch(console.error);
