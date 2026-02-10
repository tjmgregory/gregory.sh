import { getPosts } from '$lib/posts';
import { trackRssSubscriber } from '$lib/rss-stats';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://gregory.sh';
const SITE_TITLE = 'gregory.sh';
const SITE_DESCRIPTION =
	'Theo Gregory builds companies with AI agents. Ex-Head of Engineering sharing real lessons on AI-assisted development, solo startups, and shipping fast.';

function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ request, platform }) => {
	const posts = getPosts();

	// Track subscriber (fire-and-forget)
	const userAgent = request.headers.get('user-agent');
	if (userAgent && platform?.env?.RSS_STATS) {
		trackRssSubscriber(platform.env.RSS_STATS, userAgent).catch((err) =>
			console.error('RSS tracking error:', err)
		);
	}

	const items = posts
		.map((post) => {
			const pubDate = new Date(post.date).toUTCString();
			return `
		<item>
			<title>${escapeXml(post.title)}</title>
			<link>${SITE_URL}/blog/${post.slug}</link>
			<guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
			<description>${escapeXml(post.description)}</description>
			<pubDate>${pubDate}</pubDate>
		</item>`;
		})
		.join('');

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(SITE_TITLE)}</title>
		<link>${SITE_URL}</link>
		<description>${escapeXml(SITE_DESCRIPTION)}</description>
		<language>en-au</language>
		<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
	</channel>
</rss>`;

	return new Response(rss.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
