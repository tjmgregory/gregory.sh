<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="container">
	<header class="site-header">
		<h1 class="site-title">gregory.sh</h1>
		<nav class="site-nav">
			<a href="/">home</a>
			<a href="/blog">blog</a>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>
