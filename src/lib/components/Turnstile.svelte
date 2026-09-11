<script module lang="ts">
	let scriptPromise: Promise<void> | undefined;

	function loadScript() {
		if (window.turnstile) return Promise.resolve();
		if (scriptPromise) return scriptPromise;

		scriptPromise = new Promise((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');
			const script = existing ?? document.createElement('script');

			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(new Error('Turnstile failed to load')), {
				once: true
			});

			if (!existing) {
				script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
				script.async = true;
				script.defer = true;
				script.dataset.turnstileScript = '';
				document.head.appendChild(script);
			}
		});

		return scriptPromise;
	}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { turnstileSiteKey } from '$lib/turnstile-config';

	let {
		siteKey,
		action,
		onToken,
		onError = () => undefined,
		theme = 'dark',
		class: className = ''
	}: {
		siteKey: string;
		action: string;
		onToken: (token: string | null) => void;
		onError?: () => void;
		theme?: 'light' | 'dark' | 'auto';
		class?: string;
	} = $props();

	let container: HTMLDivElement;
	let widgetId: string | undefined;

	export function reset() {
		onToken(null);
		if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
	}

	onMount(() => {
		void loadScript()
			.then(() => {
				if (!window.turnstile) throw new Error('Turnstile did not initialize');
				const effectiveSiteKey = turnstileSiteKey(window.location.hostname, siteKey);
				widgetId = window.turnstile.render(container, {
					sitekey: effectiveSiteKey,
					action,
					theme,
					size: 'flexible',
					appearance: 'interaction-only',
					callback: (token) => onToken(token),
					'expired-callback': () => onToken(null),
					'error-callback': () => {
						onToken(null);
						onError();
					}
				});
			})
			.catch(() => onError());
	});

	onDestroy(() => {
		if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
	});
</script>

<div bind:this={container} class={className}></div>
