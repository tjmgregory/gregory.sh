import type { Element, ElementContent, Root as HastRoot } from 'hast';
import type { Code, Root } from 'mdast';
import { refractor, type Syntax } from 'refractor/core';
import bash from 'refractor/bash';
import css from 'refractor/css';
import diff from 'refractor/diff';
import docker from 'refractor/docker';
import go from 'refractor/go';
import ini from 'refractor/ini';
import javascript from 'refractor/javascript';
import json from 'refractor/json';
import jsx from 'refractor/jsx';
import markdownLanguage from 'refractor/markdown';
import markup from 'refractor/markup';
import python from 'refractor/python';
import rust from 'refractor/rust';
import shellSession from 'refractor/shell-session';
import sql from 'refractor/sql';
import swift from 'refractor/swift';
import toml from 'refractor/toml';
import tsx from 'refractor/tsx';
import typescript from 'refractor/typescript';
import yaml from 'refractor/yaml';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { retext } from 'retext';
import retextSmartypants from 'retext-smartypants';
import { unified, type Transformer } from 'unified';
import { visit } from 'unist-util-visit';
import { ASSETS_ORIGIN, type PostImage } from './posts';

// Reproduces the HTML mdsvex built for posts when they lived in this repo.

// The site styles no Prism tokens, so a language missing here only drops invisible spans.
// Grammars are built on first use, so a cold isolate pays only for what a post needs.
const syntaxes = new Map<string, Syntax>();
for (const syntax of [
	bash, css, diff, docker, go, ini, javascript, json, jsx, markdownLanguage, markup,
	python, rust, shellSession, sql, swift, toml, tsx, typescript, yaml
]) {
	for (const name of [syntax.displayName, ...(syntax.aliases ?? [])]) syntaxes.set(name, syntax);
}

function grammarFor(language: string | undefined): string | undefined {
	const syntax = language ? syntaxes.get(language) : undefined;
	if (!syntax) return undefined;
	refractor.register(syntax);
	return language;
}

const smartypants = retext().use(retextSmartypants);
// Text with none of these comes out of smartypants unchanged, so it skips the parse.
const SMARTENS = /['"`]|--|\.\s*\./;

// Per text node, as mdsvex did, so quotes next to inline markup turn the same way.
function smartTypography() {
	return (tree: Root) => {
		visit(tree, 'text', (node) => {
			if (SMARTENS.test(node.value)) node.value = String(smartypants.processSync(node.value));
		});
	};
}

function nofollowExternalLinks() {
	return (tree: Root) => {
		const definitions = new Map<string, string>();
		visit(tree, 'definition', (node) => {
			definitions.set(node.identifier, node.url);
		});
		visit(tree, (node) => {
			if (node.type !== 'link' && node.type !== 'linkReference') return;
			const url = node.type === 'link' ? node.url : definitions.get(node.identifier);
			if (!url || !/^https?:/.test(url)) return;
			node.data ??= {};
			node.data.hProperties = { ...node.data.hProperties, rel: ['nofollow'] };
		});
	};
}

function codeBlock(_state: unknown, node: Code): Element {
	const language = node.lang?.toLowerCase();
	// mdsvex printed `language-undefined` for a fence with no language.
	const className = [`language-${language}`];
	const grammar = grammarFor(language);
	const children: ElementContent[] = grammar
		? (refractor.highlight(node.value, grammar).children as ElementContent[])
		: [{ type: 'text', value: node.value }];
	return {
		type: 'element',
		tagName: 'pre',
		properties: { className },
		children: [{ type: 'element', tagName: 'code', properties: { className }, children }]
	};
}

const STEPS = [480, 640, 960, 1280];
const FALLBACK_STEP = 640;
// The 640px content column (.container in app.css) less its 20px gutters on narrow screens.
const SIZES = '(min-width: 680px) 640px, calc(100vw - 40px)';
const EAGER_BLOCKS = 2;

// The WAF rule on assets.crafts.software allows only these option strings; keep them in step.
export function transformOptions(step: number): string {
	return `width=${step},format=auto,metadata=none`;
}

function transformUrl(key: string, step: number): string {
	return `${ASSETS_ORIGIN}cdn-cgi/image/${transformOptions(step)}/${key}`;
}

// Transforms never upscale: the first step at or past the intrinsic width is described at the intrinsic width.
function candidates(intrinsic: number): { step: number; w: number }[] {
	const list = [];
	for (const step of STEPS) {
		list.push({ step, w: Math.min(step, intrinsic) });
		if (step >= intrinsic) break;
	}
	return list;
}

function sizedImage(img: Element, image: PostImage, eager: boolean) {
	img.properties = {
		...img.properties,
		...(image.url.startsWith(ASSETS_ORIGIN) && responsiveSources(image)),
		width: image.width,
		height: image.height,
		decoding: 'async',
		loading: eager ? 'eager' : 'lazy',
		...(eager && { fetchPriority: 'high' }),
		...(image.color && { dataColor: image.color })
	};
}

function responsiveSources(image: PostImage) {
	const key = image.url.slice(ASSETS_ORIGIN.length);
	const options = candidates(image.width);
	const fallback = options.find((option) => option.step === FALLBACK_STEP) ?? options[options.length - 1];
	return {
		src: transformUrl(key, fallback.step),
		srcSet: options.map(({ step, w }) => `${transformUrl(key, step)} ${w}w`).join(', '),
		sizes: SIZES
	};
}

function responsiveImages(): Transformer<HastRoot> {
	return (tree, file) => {
		const images = (file.data as { images?: PostImage[] }).images;
		if (!images?.length) return;
		const byUrl = new Map(images.map((image) => [image.url, image]));

		// Root text nodes are the newlines between blocks; raw HTML blocks still count.
		const blocks = tree.children.filter((node) => node.type !== 'text');
		blocks.forEach((block, index) => {
			if (block.type !== 'element') return;
			visit(block, 'element', (node) => {
				if (node.tagName !== 'img') return;
				const image = byUrl.get(String(node.properties.src ?? ''));
				if (image) sizedImage(node, image, index < EAGER_BLOCKS);
			});
		});
	};
}

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(nofollowExternalLinks)
	.use(smartTypography)
	.use(remarkRehype, { allowDangerousHtml: true, handlers: { code: codeBlock } })
	.use(responsiveImages)
	.use(rehypeStringify, { allowDangerousHtml: true });

export function renderMarkdown(markdown: string, images?: PostImage[]): string {
	return String(processor.processSync({ value: markdown, data: { images } }));
}
