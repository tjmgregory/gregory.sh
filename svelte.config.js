import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// A mail client posting the one-click unsubscribe URL sends no origin,
		// and the built-in check cannot be waived for one route. hooks.server.ts
		// runs the same check for everything else.
		csrf: { trustedOrigins: ['*'] }
	}
};

export default config;
