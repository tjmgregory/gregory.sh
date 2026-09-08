// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			context?: { waitUntil(promise: Promise<unknown>): void };
			env: {
			RSS_STATS: KVNamespace;
			HEALTH_STATE: DurableObjectNamespace;
			HEALTH_ENVIRONMENT?: 'local' | 'preview' | 'production';
			CF_PAGES_COMMIT_SHA?: string;
			HEALTH_STATE: DurableObjectNamespace;
			HEALTH_ENVIRONMENT?: 'local' | 'preview' | 'production';
				TURNSTILE_SECRET_KEY?: string;
				/** Pages secret, set by the deploy workflow from 1Password. */
				NEWSROOM_LISTS_TOKEN?: string;
				/** Optional [vars] override for the newsroom lists host. */
				NEWSROOM_LISTS_URL?: string;
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
