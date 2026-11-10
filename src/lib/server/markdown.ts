import type { Element, ElementContent } from 'hast';
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
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

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

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(nofollowExternalLinks)
	.use(smartTypography)
	.use(remarkRehype, { allowDangerousHtml: true, handlers: { code: codeBlock } })
	.use(rehypeStringify, { allowDangerousHtml: true });

export function renderMarkdown(markdown: string): string {
	return String(processor.processSync(markdown));
}
