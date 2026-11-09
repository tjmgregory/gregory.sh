import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

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
