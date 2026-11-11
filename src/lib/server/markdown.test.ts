import { describe, expect, it } from 'vitest';
import { renderMarkdown, transformOptions } from './markdown';
import type { PostImage, PostVideo } from './posts';

describe('renderMarkdown', () => {
	it('sets smart quotes, apostrophes, dashes and ellipses in prose', () => {
		expect(renderMarkdown(`It's "fine"... -- really 'so'`)).toBe(
			'<p>It’s “fine”… — really ‘so’</p>'
		);
	});

	it('leaves inline code and code blocks as written', () => {
		const html = renderMarkdown("Run `don't \"quote\"` here\n\n```\necho \"it's\" <b>\n```");
		expect(html).toContain('<code>don\'t "quote"</code>');
		expect(html).toContain('echo "it\'s" &#x3C;b>');
	});

	it('marks absolute http(s) links nofollow, and only those', () => {
		const html = renderMarkdown(
			[
				'[a](https://example.com) [b](http://example.com) [c](/blog/x) [d](#install)',
				'[e](mailto:hi@example.com) [ref][f]',
				'',
				'[f]: https://example.org'
			].join('\n')
		);
		expect(html).toContain('<a href="https://example.com" rel="nofollow">a</a>');
		expect(html).toContain('<a href="http://example.com" rel="nofollow">b</a>');
		expect(html).toContain('<a href="/blog/x">c</a>');
		expect(html).toContain('<a href="#install">d</a>');
		expect(html).toContain('<a href="mailto:hi@example.com">e</a>');
		expect(html).toContain('<a href="https://example.org" rel="nofollow">ref</a>');
	});

	it('renders a fence without a language the way mdsvex did', () => {
		expect(renderMarkdown('```\n/plugin install x@y\nline two\n```')).toBe(
			'<pre class="language-undefined"><code class="language-undefined">/plugin install x@y\nline two</code></pre>'
		);
	});

	it('highlights a known language with Prism token classes, keeping the alias in the class', () => {
		const html = renderMarkdown('```TS\nconst answer = 42;\n```');
		expect(html).toMatch(/^<pre class="language-ts"><code class="language-ts">/);
		expect(html).toContain('<span class="token keyword">const</span>');
		expect(html).toContain('<span class="token number">42</span>');
	});

	it('escapes an unknown language without highlighting it', () => {
		expect(renderMarkdown('```brainfunk\n<+>\n```')).toBe(
			'<pre class="language-brainfunk"><code class="language-brainfunk">&#x3C;+></code></pre>'
		);
	});

	it('renders headings without ids, images, emphasis and blockquotes', () => {
		const html = renderMarkdown(
			'## The power of a deadline\n\n![A chart](/img/chart.png "Chart")\n\n> **Tick** _tock_.'
		);
		expect(html).toContain('<h2>The power of a deadline</h2>');
		expect(html).toContain('<img src="/img/chart.png" alt="A chart" title="Chart">');
		expect(html).toContain('<blockquote>\n<p><strong>Tick</strong> <em>tock</em>.</p>\n</blockquote>');
	});

	it('lets a list interrupt a paragraph and supports GFM tables', () => {
		const html = renderMarkdown('Busy with:\n- Widgets\n- Invites\n\n| a | b |\n| - | - |\n| 1 | 2 |');
		expect(html).toContain('<p>Busy with:</p>\n<ul>\n<li>Widgets</li>\n<li>Invites</li>\n</ul>');
		expect(html).toContain('<table>');
		expect(html).toContain('<td>1</td>');
	});

	it('passes raw HTML through, as mdsvex did', () => {
		expect(renderMarkdown('<details><summary>More</summary>\n\nHidden\n\n</details>')).toContain(
			'<details><summary>More</summary>'
		);
	});
});

describe('renderMarkdown with post images', () => {
	const key = '2026/11/ab12cd34ef56.jpg';
	const url = `https://assets.crafts.software/${key}`;
	const variant = (width: number) =>
		`https://assets.crafts.software/cdn-cgi/image/width=${width},format=auto,metadata=none/${key}`;
	const photo: PostImage = { url, width: 4032, height: 3024, color: '#8a7f72', alt: 'A desk' };

	function img(html: string, n = 0): HTMLImageElement {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return doc.querySelectorAll('img')[n] as HTMLImageElement;
	}

	it('emits exactly four option strings, the ones the WAF rule allows', () => {
		expect([480, 640, 960, 1280].map(transformOptions)).toEqual([
			'width=480,format=auto,metadata=none',
			'width=640,format=auto,metadata=none',
			'width=960,format=auto,metadata=none',
			'width=1280,format=auto,metadata=none'
		]);
	});

	it('turns a known asset into a sized, lazy, responsive img with its colour on data', () => {
		const html = renderMarkdown(`One.\n\nTwo.\n\n![A desk](${url})`, [photo]);
		expect(html).toContain(
			`<img src="${variant(640)}" alt="A desk" srcset="${variant(480)} 480w, ${variant(640)} 640w, ${variant(960)} 960w, ${variant(1280)} 1280w" sizes="(min-width: 680px) 640px, calc(100vw - 40px)" width="4032" height="3024" decoding="async" loading="lazy" data-color="#8a7f72">`
		);
	});

	it('loads an image in the first two blocks eagerly and first', () => {
		const first = img(renderMarkdown(`![A desk](${url})\n\nText.`, [photo]));
		expect(first.getAttribute('loading')).toBe('eager');
		expect(first.getAttribute('fetchpriority')).toBe('high');

		const second = img(renderMarkdown(`Text.\n\n![A desk](${url})`, [photo]));
		expect(second.getAttribute('loading')).toBe('eager');

		const third = img(renderMarkdown(`<div>raw</div>\n\nText.\n\n![A desk](${url})`, [photo]));
		expect(third.getAttribute('loading')).toBe('lazy');
		expect(third.hasAttribute('fetchpriority')).toBe(false);
	});

	it('never offers a width above the intrinsic one, and keeps to the four option strings', () => {
		const narrow = img(renderMarkdown(`![x](${url})`, [{ ...photo, width: 700, height: 400 }]));
		expect(narrow.getAttribute('srcset')).toBe(`${variant(480)} 480w, ${variant(640)} 640w, ${variant(960)} 700w`);
		expect(narrow.getAttribute('src')).toBe(variant(640));

		const tiny = img(renderMarkdown(`![x](${url})`, [{ ...photo, width: 300, height: 200 }]));
		expect(tiny.getAttribute('srcset')).toBe(`${variant(480)} 300w`);
		expect(tiny.getAttribute('src')).toBe(variant(480));
		expect(tiny.getAttribute('width')).toBe('300');

		const exact = img(renderMarkdown(`![x](${url})`, [{ ...photo, width: 960, height: 540 }]));
		expect(exact.getAttribute('srcset')).toBe(`${variant(480)} 480w, ${variant(640)} 640w, ${variant(960)} 960w`);
	});

	it('leaves the data-color off when the record has no colour', () => {
		const { color: _color, ...plain } = photo;
		expect(img(renderMarkdown(`![x](${url})`, [plain])).hasAttribute('data-color')).toBe(false);
	});

	it('sizes a known image on another host without transform URLs', () => {
		const external = 'https://example.com/a.png';
		const html = renderMarkdown(`Text.\n\nMore.\n\n![b](${external})`, [{ url: external, width: 300, height: 200 }]);
		expect(html).toContain(
			`<img src="${external}" alt="b" width="300" height="200" decoding="async" loading="lazy">`
		);
	});

	it('renders images with no matching entry as before', () => {
		const other = 'https://assets.crafts.software/2026/11/ffffffffffff.png';
		const markdown = `![a](${other})\n\n![c](/img/c.png)\n\n<img src="${url}" alt="raw">`;
		expect(renderMarkdown(markdown, [photo])).toBe(renderMarkdown(markdown));
		expect(renderMarkdown(markdown, [photo])).toContain(`<p><img src="${other}" alt="a"></p>`);
	});
});

describe('renderMarkdown with post videos', () => {
	const mp4 = 'https://assets.crafts.software/2026/11/0a1b2c3d4e5f.mp4';
	const jpg = 'https://assets.crafts.software/2026/11/0a1b2c3d4e5f.jpg';
	const posterVariant = 'https://assets.crafts.software/cdn-cgi/image/width=1280,format=auto,metadata=none/2026/11/0a1b2c3d4e5f.jpg';
	const clip: PostVideo = { url: mp4, poster: jpg, width: 1280, height: 720, color: '#1a2b3c', durationMs: 4200, alt: 'The notch swinging' };

	function video(html: string): HTMLVideoElement {
		return new DOMParser().parseFromString(html, 'text/html').querySelector('video') as HTMLVideoElement;
	}

	it('turns a known video into a player in the paragraph the image sat in', () => {
		expect(renderMarkdown(`Intro.\n\n![The notch swinging](${mp4})`, undefined, [clip])).toBe(
			'<p>Intro.</p>\n' +
				`<p><video controls playsinline preload="metadata" poster="${posterVariant}" width="1280" height="720" data-color="#1a2b3c" aria-label="The notch swinging">` +
				`<source src="${mp4}" type="video/mp4"><a href="${mp4}">The notch swinging</a></video></p>`
		);
	});

	it('never sends the mp4 through a transform, and keeps the poster to an allowed option string', () => {
		const player = video(renderMarkdown(`![x](${mp4})`, undefined, [clip]));
		expect(player.querySelector('source')?.getAttribute('src')).toBe(mp4);
		expect(player.getAttribute('poster')).toBe(posterVariant);
		expect(player.hasAttribute('src')).toBe(false);
		expect(player.hasAttribute('alt')).toBe(false);
		expect(player.hasAttribute('loading')).toBe(false);
	});

	it('uses the markdown alt when the entry has none, and drops the label when both are empty', () => {
		const { alt: _alt, ...unlabelled } = clip;
		expect(video(renderMarkdown(`![From markdown](${mp4})`, undefined, [unlabelled])).getAttribute('aria-label')).toBe(
			'From markdown'
		);
		const bare = video(renderMarkdown(`![](${mp4})`, undefined, [unlabelled]));
		expect(bare.hasAttribute('aria-label')).toBe(false);
		expect(bare.querySelector('a')?.textContent).toBe(mp4);
	});

	it('leaves the data-color off when the entry has no colour', () => {
		const { color: _color, ...plain } = clip;
		expect(video(renderMarkdown(`![x](${mp4})`, undefined, [plain])).hasAttribute('data-color')).toBe(false);
	});

	it('uses a poster on another host as given', () => {
		const poster = 'https://example.com/poster.jpg';
		expect(video(renderMarkdown(`![x](${mp4})`, undefined, [{ ...clip, poster }])).getAttribute('poster')).toBe(poster);
	});

	it('renders photos and videos in the same post, each from its own list', () => {
		const key = '2026/11/ab12cd34ef56.jpg';
		const photo: PostImage = { url: `https://assets.crafts.software/${key}`, width: 800, height: 600 };
		const html = renderMarkdown(`![a](${photo.url})\n\n![b](${mp4})`, [photo], [clip]);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		expect(doc.querySelectorAll('img')).toHaveLength(1);
		expect(doc.querySelector('img')?.getAttribute('srcset')).toContain(key);
		expect(doc.querySelectorAll('video')).toHaveLength(1);
	});

	it('renders an mp4 image with no videos entry as before', () => {
		const markdown = `![b](${mp4})`;
		expect(renderMarkdown(markdown, undefined, [])).toBe(renderMarkdown(markdown));
		expect(renderMarkdown(markdown)).toBe(`<p><img src="${mp4}" alt="b"></p>`);
	});
});
