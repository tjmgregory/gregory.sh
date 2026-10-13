<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import NavContact from '$lib/components/NavContact.svelte';

	let { children } = $props();
	const socials = [
		['LinkedIn', 'https://linkedin.com/in/tjmgregory'],
		['X', 'https://x.com/thgregory'],
		['Threads', 'https://www.threads.com/@tjmgregory'],
		['Bluesky', 'https://bsky.app/profile/tjmgregory.bsky.social'],
		['Mastodon', 'https://mastodon.social/@tjmgregory'],
		['GitHub', 'https://github.com/thgregory'],
		['RSS', '/rss.xml']
	];
</script>

<svelte:head>
	<link
		rel="preload"
		href="/fonts/jetbrains-mono-400.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="/fonts/source-serif.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	{#if !dev}
		<script
			defer
			src="https://analytics.crafts.software/script.js"
			data-website-id="8ebc83d4-d185-40cf-9bc0-9d22b98135b8"
			data-domains="gregory.sh"
		></script>
	{/if}
</svelte:head>

<div class="container">
	<header class="site-header">
		<a href="/" class="site-title">Theo Gregory</a>
		<nav class="site-nav" aria-label="Main navigation">
			<a
				href="/ideas"
				aria-current={page.url.pathname === '/ideas' ? 'page' : undefined}
				>Ideas</a
			>
			<a
				href="/blog"
				aria-current={page.url.pathname.startsWith('/blog')
					? 'page'
					: undefined}>Writing</a
			>
			<a
				href="/subscribe"
				aria-current={page.url.pathname === '/subscribe' ? 'page' : undefined}
				>Newsletter</a
			>
		</nav>
	</header>
	<main>
		{@render children()}
		{#if page.url.pathname !== '/subscribe' && page.url.pathname !== '/about'}
			<Newsletter />
		{/if}
	</main>
	<footer class="site-footer">
		<nav class="socials" aria-label="Social links">
			{#each socials as [name, href]}
				<a {href} rel={name === 'Mastodon' ? 'me' : undefined}>{name}</a>
			{/each}
		</nav>
		<div class="footer-credit">
			<span>Theo Gregory</span><span aria-hidden="true">·</span>
			<a href="https://crafts.software">The Software Engineer Ltd</a><span
				aria-hidden="true">·</span
			>
			<NavContact />
		</div>
	</footer>
</div>
