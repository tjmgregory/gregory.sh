#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(process.argv[2] || 'vendor/health-contract/pages-health-adapter.json', 'utf8'));
let failed = false;
for (const [file, expected] of Object.entries(manifest.files)) {
	const actual = createHash('sha256').update(await readFile(file)).digest('hex');
	if (actual !== expected) {
		console.error(`health adapter checksum mismatch: ${file}`);
		failed = true;
	}
}
if (failed) process.exit(1);
