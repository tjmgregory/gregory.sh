/**
 * Newsletter sender for gregory.sh
 *
 * Reads a blog post, renders it into the HTML email template,
 * and sends it to all subscribers (or just yourself for preview).
 *
 * Usage:
 *   bun run scripts/newsletter/send.ts <post-slug> --preview
 *   bun run scripts/newsletter/send.ts <post-slug> --send
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createTransport } from "nodemailer";
import matter from "gray-matter";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = join(import.meta.dir, "../..");
const POSTS_DIR = join(ROOT, "content/posts");
const TEMPLATE_PATH = join(import.meta.dir, "template.html");
const ENV_PATH = join(import.meta.dir, ".env");

function loadEnv(): Record<string, string> {
	const raw = readFileSync(ENV_PATH, "utf-8");
	const env: Record<string, string> = {};
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
	}
	return env;
}

const env = loadEnv();

// ---------------------------------------------------------------------------
// Post parsing
// ---------------------------------------------------------------------------

interface Post {
	slug: string;
	title: string;
	date: string;
	body: string;
}

function findPostFile(slug: string): string {
	const files = readdirSync(POSTS_DIR);
	const match = files.find((f) => f.endsWith(`${slug}.md`));
	if (!match) {
		console.error(`No post found matching slug: ${slug}`);
		console.error(`Available posts:`);
		for (const f of files) console.error(`  ${f}`);
		process.exit(1);
	}
	return join(POSTS_DIR, match);
}

function parsePost(slug: string): Post {
	const filePath = findPostFile(slug);
	const raw = readFileSync(filePath, "utf-8");
	const { data, content } = matter(raw);

	const title = data.title as string;
	const date = new Date(data.date as string).toLocaleDateString("en-GB", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	// Take the first 2-3 paragraphs (non-empty lines separated by blank lines)
	const paragraphs = content
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter((p) => p.length > 0 && !p.startsWith("#"));

	const excerpt = paragraphs.slice(0, 3);
	const body = excerpt
		.map((p) => `<p style="margin: 0 0 16px 0;">${escapeHtml(p)}</p>`)
		.join("\n");

	return { slug, title, date, body };
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#8217;")
		.replace(/—/g, "&#8212;");
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function renderEmail(post: Post, recipientEmail: string): string {
	const template = readFileSync(TEMPLATE_PATH, "utf-8");
	const unsubscribeUrl = `https://gregory.sh/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

	return template
		.replace(/\{\{title\}\}/g, escapeHtml(post.title))
		.replace(/\{\{date\}\}/g, post.date)
		.replace(/\{\{slug\}\}/g, post.slug)
		.replace(/\{\{body\}\}/g, post.body)
		.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);
}

// ---------------------------------------------------------------------------
// Subscribers (Cloudflare KV)
// ---------------------------------------------------------------------------

async function fetchSubscribers(): Promise<string[]> {
	const namespaceId = env.KV_NAMESPACE_ID;
	const result = Bun.spawnSync([
		"npx",
		"wrangler",
		"kv",
		"key",
		"list",
		`--namespace-id=${namespaceId}`,
	], { cwd: ROOT });

	if (result.exitCode !== 0) {
		console.error("Failed to fetch subscribers from KV:");
		console.error(result.stderr.toString());
		process.exit(1);
	}

	const keys = JSON.parse(result.stdout.toString()) as Array<{ name: string }>;
	return keys.map((k) => k.name);
}

// ---------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------

function createSmtpTransport() {
	return createTransport({
		host: env.SMTP_HOST,
		port: parseInt(env.SMTP_PORT),
		secure: false,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS,
		},
	});
}

async function sendEmail(
	transport: ReturnType<typeof createTransport>,
	to: string,
	subject: string,
	html: string,
) {
	await transport.sendMail({
		from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
		to,
		subject,
		html,
	});
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
	const args = process.argv.slice(2);
	const slug = args.find((a) => !a.startsWith("-"));
	const mode = args.includes("--send")
		? "send"
		: args.includes("--preview")
			? "preview"
			: null;

	if (!slug || !mode) {
		console.log("Usage:");
		console.log("  bun run scripts/newsletter/send.ts <post-slug> --preview");
		console.log("  bun run scripts/newsletter/send.ts <post-slug> --send");
		process.exit(1);
	}

	const post = parsePost(slug);
	const transport = createSmtpTransport();

	console.log(`\nPost: ${post.title}`);
	console.log(`Date: ${post.date}`);
	console.log(`Slug: ${post.slug}`);

	if (mode === "preview") {
		const previewEmail = env.SMTP_USER;
		const html = renderEmail(post, previewEmail);
		console.log(`\nSending preview to ${previewEmail}...`);
		await sendEmail(transport, previewEmail, post.title, html);
		console.log("Preview sent!");
	} else {
		const subscribers = await fetchSubscribers();
		console.log(`\nSubscribers: ${subscribers.length}`);
		console.log("");

		// Confirmation prompt
		process.stdout.write(
			`Send "${post.title}" to ${subscribers.length} subscribers? [y/N] `,
		);
		const answer = await new Promise<string>((resolve) => {
			process.stdin.once("data", (data) => resolve(data.toString().trim()));
		});

		if (answer.toLowerCase() !== "y") {
			console.log("Aborted.");
			process.exit(0);
		}

		let sent = 0;
		let failed = 0;

		for (const email of subscribers) {
			try {
				const html = renderEmail(post, email);
				await sendEmail(transport, email, post.title, html);
				sent++;
				console.log(`  ✓ ${email}`);
			} catch (err) {
				failed++;
				console.error(`  ✗ ${email}: ${err}`);
			}
		}

		console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
	}

	transport.close();
}

main();
