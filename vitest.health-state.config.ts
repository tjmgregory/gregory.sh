import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), cloudflareTest({ wrangler: { configPath: './wrangler.health-state.toml' } })],
	test: { include: ['test/health-state.integration.test.ts'] }
});
