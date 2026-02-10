<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { getPost } from '$lib/posts';
	import { Seo, FormattedDate, SubscribeForm } from '$lib';
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

<Seo
	title={post.title}
	description={post.description}
	url={`https://gregory.sh/blog/${post.slug}`}
	type="article"
	publishedTime={post.date}
/>

<article>
	<header class="post-header">
		<h1>{post.title}</h1>
		<p class="post-meta"><FormattedDate datetime={post.date} /></p>
	</header>

	<div class="post-content">
		<post.content />
	</div>
</article>

<aside class="subscribe-cta">
	<p>Enjoyed this? Subscribe to get notified when I publish something new.</p>
	<SubscribeForm />
</aside>

<p style="margin-top: 2rem;">
	<a href="/blog">← Back to archives</a>
</p>

<style>
	.subscribe-cta {
		margin-top: 3rem;
		padding: 1.5rem;
		background: #f8f8f8;
		border-radius: 8px;
		text-align: center;
	}

	.subscribe-cta p {
		margin: 0 0 1rem 0;
	}

	.subscribe-cta :global(.subscribe-form) {
		justify-content: center;
	}
</style>
