/**
 * Fails when src/lib/newsroom/types.ts is not what the pinned schema
 * generates. Runs in CI so a hand-edited client type cannot ship.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = path.join(ROOT, 'src/lib/newsroom/openapi.json');
const COMMITTED = path.join(ROOT, 'src/lib/newsroom/types.ts');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'newsroom-types-'));
const fresh = path.join(temp, 'types.ts');

try {
	execFileSync('bunx', ['openapi-typescript', SCHEMA, '-o', fresh], {
		cwd: ROOT,
		stdio: 'inherit'
	});

	const a = fs.readFileSync(COMMITTED, 'utf-8');
	const b = fs.readFileSync(fresh, 'utf-8');
	if (a !== b) {
		console.error(
			'src/lib/newsroom/types.ts does not match src/lib/newsroom/openapi.json.'
		);
		console.error('Run: bun run newsroom:generate');
		process.exit(1);
	}
	console.log('newsroom types match the pinned schema.');
} finally {
	fs.rmSync(temp, { recursive: true, force: true });
}
