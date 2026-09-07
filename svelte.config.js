import adapter from '@sveltejs/adapter-cloudflare';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		mdsvex({
			extensions: ['.md']
		})
	],
	kit: {
		adapter: adapter(),
		// A mail client posting the one-click unsubscribe URL sends no origin,
		// and the built-in check cannot be waived for one route. hooks.server.ts
		// runs the same check for everything else.
		csrf: { trustedOrigins: ['*'] }
	}
};

export default config;
