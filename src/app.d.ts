// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			env: {
				SUBSCRIBERS: KVNamespace;
				RSS_STATS: KVNamespace;
				TURNSTILE_SECRET_KEY?: string;
				/** Pages secret. Signs and checks one-click unsubscribe links. */
				UNSUBSCRIBE_SECRET?: string;
			};
		}
	}

	interface Window {
		turnstile?: {
			render: (container: HTMLElement, options: TurnstileOptions) => string;
			reset: (widgetId: string) => void;
			remove: (widgetId: string) => void;
		};
		umami?: {
			track: (event: string, data?: Record<string, unknown>) => void;
		};
	}

	interface TurnstileOptions {
		sitekey: string;
		action: string;
		theme: 'light' | 'dark' | 'auto';
		size: 'normal' | 'compact' | 'flexible';
		appearance: 'always' | 'execute' | 'interaction-only';
		callback: (token: string) => void;
		'expired-callback': () => void;
		'error-callback': () => void;
	}
}

declare module '*.md' {
	import type { Component } from 'svelte';
	const component: Component;
	export default component;
	export const metadata: Record<string, unknown>;
}

export {};
