// Copies the preview POSTS namespace into the local one `bun run dev:port` reads.
// Needs wrangler auth that can read the preview namespace. Writes only local storage.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import config from '../wrangler.toml';

interface Namespace {
	binding: string;
	id: string;
}

function postsId(namespaces: Namespace[] | undefined, where: string): string {
	const id = namespaces?.find((namespace) => namespace.binding === 'POSTS')?.id;
	if (!id) throw new Error(`no POSTS binding in ${where} of wrangler.toml`);
	return id;
}

const previewId = postsId(config.env?.preview?.kv_namespaces, '[env.preview]');
const localId = postsId(config.kv_namespaces, 'the top level');
const scratch = mkdtempSync(path.join(tmpdir(), 'posts-pull-'));

function wrangler(args: string[]): string {
	const result = spawnSync('bunx', ['wrangler', ...args], {
		encoding: 'utf8',
		env: { ...process.env, WRANGLER_HIDE_BANNER: 'true' }
	});
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		process.exit(result.status ?? 1);
	}
	return result.stdout;
}

// wrangler can print a notice line before the JSON it was asked for.
function json<T>(output: string): T {
	return JSON.parse(output.slice(output.search(/^[[{]/m)));
}

function file(name: string, value: unknown): string {
	const target = path.join(scratch, name);
	writeFileSync(target, JSON.stringify(value));
	return target;
}

function keys(where: '--remote' | '--local', id: string): string[] {
	const listed = json<{ name: string }[]>(wrangler(['kv', 'key', 'list', '--namespace-id', id, where]));
	return listed.map((key) => key.name);
}

try {
	const remoteKeys = keys('--remote', previewId);
	const pairs: { key: string; value: string }[] = [];
	for (let start = 0; start < remoteKeys.length; start += 100) {
		const chunk = remoteKeys.slice(start, start + 100);
		const values = json<Record<string, { value: string }>>(
			wrangler(['kv', 'bulk', 'get', file('keys.json', chunk), '--namespace-id', previewId, '--remote'])
		);
		for (const key of chunk) pairs.push({ key, value: values[key].value });
	}

	const stale = keys('--local', localId).filter((key) => !remoteKeys.includes(key));
	if (stale.length) {
		wrangler(['kv', 'bulk', 'delete', file('stale.json', stale), '--namespace-id', localId, '--local', '--force']);
	}
	if (pairs.length) {
		wrangler(['kv', 'bulk', 'put', file('pairs.json', pairs), '--namespace-id', localId, '--local']);
	}
	console.log(`Copied ${pairs.length} keys from the preview namespace, removed ${stale.length} stale local keys.`);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
