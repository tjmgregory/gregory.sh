import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['workers/short-link-card-proof/src/**/*.test.ts']
	}
});
