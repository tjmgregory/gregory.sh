<script lang="ts">
	import type { PageData } from './$types';
	import { SubscribeForm } from '$lib';

	let { data }: { data: PageData } = $props();
</script>

<p>Welcome to the system.<span class="cursor"></span></p>

<h2>Latest transmissions</h2>

{#if data.posts.length === 0}
	<p>No posts yet. The Matrix is silent.</p>
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

<section>
	<h2>Subscribe</h2>
	<p>Get notified when I publish new posts.</p>
	<SubscribeForm />
</section>
