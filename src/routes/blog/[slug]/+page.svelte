<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { getPost, getPosts } from '$lib/posts';
	import { Seo, FormattedDate } from '$lib';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const post = $derived.by(() => {
		const p = getPost(data.slug);
		if (!p) {
			throw error(404, 'Post not found');
		}
		return p;
	});
	const morePosts = $derived(
		getPosts()
			.filter((other) => other.slug !== data.slug)
			.slice(0, 2)
	);
</script>

<Seo
	title={post.title}
	seoTitle={post.seoTitle}
	description={post.description}
	url={`https://gregory.sh/blog/${post.slug}`}
	type="article"
	publishedTime={post.date}
	modifiedTime={post.updated}
	image={post.ogImage ? `https://gregory.sh${post.ogImage}` : undefined}
	keywords={post.keywords}
/>

<article>
	<header class="post-header">
		<a class="mono tap-link" href="/blog">← Writing</a>
		<p class="label"><FormattedDate datetime={post.date} format="full" /></p>
		<h1>{post.title}</h1>
	</header>

	<div class="post-content">
		<post.content />
	</div>
</article>

<section class="more-writing" aria-labelledby="more-heading">
	<div class="section-heading">
		<h2 id="more-heading">More writing</h2>
		<a class="tap-link" href="/blog">All writing →</a>
	</div>
	<ul class="post-list">
		{#each morePosts as other}
			<li class="post-row">
				<span class="label"><FormattedDate datetime={other.date} /></span>
				<h3><a href="/blog/{other.slug}">{other.title}</a></h3>
			</li>
		{/each}
	</ul>
</section>
