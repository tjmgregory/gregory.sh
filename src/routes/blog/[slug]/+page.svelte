<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { getPost } from '$lib/posts';
	import { Seo, FormattedDate, ArticleSubscribeCta } from '$lib';
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

<ArticleSubscribeCta />

<p style="margin-top: 2rem;">
	<a href="/blog">← Back to archives</a>
</p>
