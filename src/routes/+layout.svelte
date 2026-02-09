<script lang="ts">
	import '../app.css';
	import { NavSubscribe } from '$lib';

	let { children } = $props();
</script>

<div class="container">
	<header class="site-header">
		<h1 class="site-title">gregory.sh</h1>
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
