<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { getPost } from '$lib/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const post = $derived.by(() => {
		const p = getPost(data.slug);
		if (!p) {
			throw error(404, 'Post not found');
		}
		return p;
	});
</script>

<svelte:head>
	<title>{post.title} | gregory.sh</title>
	<meta name="description" content={post.description} />
</svelte:head>

<article>
	<header class="post-header">
		<h1>{post.title}</h1>
		<p class="post-meta">{post.date}</p>
	</header>

	<div class="post-content">
		<post.content />
	</div>
</article>

<p style="margin-top: 3rem;">
	<a href="/blog">← Back to archives</a>
</p>
