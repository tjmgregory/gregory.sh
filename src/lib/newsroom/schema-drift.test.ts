import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../..'
);

describe('the generated newsroom client', () => {
	it('matches the pinned schema', () => {
		expect(() =>
			execFileSync('bun', ['run', 'newsroom:check'], {
				cwd: ROOT,
				stdio: 'pipe'
			})
		).not.toThrow();
	}, 60_000);
});
