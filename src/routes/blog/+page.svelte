<script lang="ts">
	import type { PageData } from './$types';
	import { Seo } from '$lib';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="Blog"
	description="Articles on AI-assisted development, building startups with agents, and lessons from shipping software solo."
	url="https://gregory.sh/blog"
/>

<h1>Archives</h1>

{#if data.posts.length === 0}
	<p>No transmissions found.</p>
{:else}
	<ul class="post-list">
		{#each data.posts as post}
			<li class="post-item">
				<span class="post-date">{post.date}</span>
				<h3 class="post-title">
					<a href="/blog/{post.slug}">{post.title}</a>
				</h3>
				<p class="post-description">{post.description}</p>
			</li>
		{/each}
	</ul>
{/if}
