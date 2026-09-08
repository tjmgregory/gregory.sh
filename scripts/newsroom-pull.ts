/**
 * Pulls the newsroom lists schema into src/lib/newsroom/openapi.json.
 *
 * The newsroom publishes one document for the whole API. A site only ever
 * calls the list routes, so this keeps the list paths plus health and drops
 * everything else, then prunes the component schemas nothing left refers to.
 *
 * Usage:
 *   bun run newsroom:pull                     # from the public host
 *   bun run newsroom:pull --from ../path.json # from a local checkout
 *   bun run newsroom:pull --url https://...   # from another host
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PINNED = path.join(ROOT, 'src/lib/newsroom/openapi.json');
const DEFAULT_URL = 'https://the-newsroom-lists.crafts.software/openapi.json';

const KEEP_PREFIX = '/v1/lists/';
const KEEP_EXACT = ['/v1/health'];

type Json = Record<string, unknown>;

function arg(name: string): string | undefined {
	const argv = process.argv.slice(2);
	const i = argv.indexOf(`--${name}`);
	if (i === -1) return undefined;
	const value = argv[i + 1];
	if (!value || value.startsWith('--')) {
		throw new Error(`--${name} needs a value`);
	}
	return value;
}

async function readSource(): Promise<Json> {
	const from = arg('from');
	if (from) {
		const full = path.resolve(process.cwd(), from);
		console.log(`Reading ${full}`);
		return JSON.parse(fs.readFileSync(full, 'utf-8'));
	}
	const url = arg('url') ?? DEFAULT_URL;
	console.log(`Fetching ${url}`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`${url} answered ${response.status}. Pass --from <path> to pull from a checkout instead.`
		);
	}
	return (await response.json()) as Json;
}

function refsIn(value: unknown, found: Set<string>): void {
	if (Array.isArray(value)) {
		for (const item of value) refsIn(item, found);
		return;
	}
	if (!value || typeof value !== 'object') return;
	for (const [key, child] of Object.entries(value as Json)) {
		if (key === '$ref' && typeof child === 'string') {
			const name = child.split('/').pop();
			if (name) found.add(name);
			continue;
		}
		refsIn(child, found);
	}
}

function filter(source: Json): Json {
	const paths = (source.paths ?? {}) as Json;
	const kept: Json = {};
	for (const key of Object.keys(paths).sort()) {
		if (key.startsWith(KEEP_PREFIX) || KEEP_EXACT.includes(key)) {
			kept[key] = paths[key];
		}
	}
	if (Object.keys(kept).length === 0) {
		throw new Error('the source document holds no list routes');
	}

	const out: Json = { openapi: source.openapi, info: source.info };
	if (source.servers) out.servers = source.servers;
	out.paths = kept;

	const schemas = ((source.components as Json | undefined)?.schemas ??
		{}) as Json;
	const wanted = new Set<string>();
	refsIn(kept, wanted);
	// A kept schema can refer to another one, so walk until nothing new turns up.
	let size = -1;
	while (size !== wanted.size) {
		size = wanted.size;
		for (const name of [...wanted]) {
			if (schemas[name]) refsIn(schemas[name], wanted);
		}
	}
	if (wanted.size > 0) {
		const componentSchemas: Json = {};
		for (const name of [...wanted].sort()) {
			if (schemas[name]) componentSchemas[name] = schemas[name];
		}
		out.components = { schemas: componentSchemas };
	}

	const securitySchemes = (source.components as Json | undefined)
		?.securitySchemes;
	if (securitySchemes) {
		const components = (out.components ?? {}) as Json;
		components.securitySchemes = securitySchemes;
		out.components = components;
	}

	return out;
}

const filtered = filter(await readSource());
fs.writeFileSync(PINNED, `${JSON.stringify(filtered, null, 2)}\n`, 'utf-8');
console.log(
	`Wrote ${path.relative(ROOT, PINNED)} with ${Object.keys(filtered.paths as Json).length} paths.`
);
console.log('Now run: bun run newsroom:generate');
