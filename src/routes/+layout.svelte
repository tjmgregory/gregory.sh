<script lang="ts">
	import '../app.css';
	import { NavSubscribe, introComplete, shouldAnimateFadeIn } from '$lib';
	import { page } from '$app/stores';

	let { children } = $props();

	// Only apply intro styling on homepage
	let isHomepage = $derived($page.url.pathname === '/');
	let duringIntro = $derived(isHomepage && !$introComplete);
	let shouldAnimate = $derived(isHomepage && $shouldAnimateFadeIn && $introComplete);
</script>

<div class="container">
	<header class="site-header" class:invisible={duringIntro} class:fade-in={shouldAnimate}>
		<div class="site-title">gregory.sh</div>
		<nav class="site-nav">
			<div class="nav-links">
				<a href="/">home</a>
				<a href="/blog">blog</a>
			</div>
			<NavSubscribe />
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.invisible {
		opacity: 0;
		pointer-events: none;
	}

	.fade-in {
		animation: fadeIn 0.6s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
