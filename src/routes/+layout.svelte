<script lang="ts">
	import '../app.css';
	import { NavSubscribe, NavContact, introComplete, shouldAnimateFadeIn } from '$lib';
	import { page } from '$app/stores';

	let { children } = $props();

	// Only apply intro styling on homepage
	let isHomepage = $derived($page.url.pathname === '/');
	let duringIntro = $derived(isHomepage && !$introComplete);
	let shouldAnimate = $derived(isHomepage && $shouldAnimateFadeIn && $introComplete);
</script>

<div class="container">
	<header class="site-header" class:invisible={duringIntro} class:fade-in={shouldAnimate}>
		<a href="/" class="site-title-link"><div class="site-title">gregory.sh</div></a>
		<nav class="site-nav">
			<div class="nav-left">
				<a href="/blog">blog</a>
				<NavContact />
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

	.site-title-link {
		border-bottom: none;
		text-decoration: none;
	}

	.site-title-link:hover {
		text-shadow: none;
	}

	.site-title-link:hover .site-title {
		text-shadow: 0 0 20px var(--matrix-green-glow);
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
</style>
