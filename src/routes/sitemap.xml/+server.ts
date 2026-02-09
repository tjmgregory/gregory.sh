import { getPosts } from '$lib/posts';
import type { RequestHandler } from './$types';

const site = 'https://gregory.sh';

interface SitemapEntry {
	loc: string;
	priority: string;
	changefreq: string;
	lastmod?: string;
}

export const prerender = true;

export const GET: RequestHandler = async () => {
	const posts = getPosts();

	const pages: SitemapEntry[] = [
		{ loc: '', priority: '1.0', changefreq: 'weekly' },
		{ loc: '/blog', priority: '0.8', changefreq: 'weekly' }
	];

	const postEntries: SitemapEntry[] = posts.map((post) => ({
		loc: `/blog/${post.slug}`,
		lastmod: post.date,
		priority: '0.7',
		changefreq: 'monthly'
	}));

	const allEntries = [...pages, ...postEntries];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
	.map(
		(entry) => `  <url>
    <loc>${site}${entry.loc}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
