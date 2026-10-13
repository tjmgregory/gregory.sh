<script lang="ts">
	import type { PageData } from './$types';
	import { Seo, FormattedDate } from '$lib';
	let { data }: { data: PageData } = $props();
	const years = $derived([
		...new Set(data.posts.map((post) => post.date.slice(0, 4)))
	]);
</script>

<Seo
	title="Writing"
	description="Notes on building products, working with agents, and running small companies."
	url="https://gregory.sh/blog"
/>
<h1 class="page-intro">
	Notes on building products, working with agents, and running small companies.
</h1>
{#each years as year}
	<section aria-labelledby="year-{year}">
		<h2 class="year mono" id="year-{year}">{year}</h2>
		<ul class="post-list writing-list">
			{#each data.posts.filter((post) => post.date.startsWith(year)) as post}
				<li class="post-row">
					<span class="label"
						><FormattedDate datetime={post.date} format="month" /></span
					>
					<div>
						<h3><a href="/blog/{post.slug}">{post.title}</a></h3>
						<p class="secondary">{post.description}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<p>
		New notes will appear here. You can subscribe below to get them by email.
	</p>
{/each}
<p><a class="mono tap-link" href="/rss.xml">Also as RSS</a></p>

<style>
	.year {
		border-bottom: 1px solid var(--hairline);
		padding-bottom: 12px;
		margin-bottom: 20px;
		font-weight: 500;
	}
	.writing-list {
		gap: 28px;
	}
	h3 {
		font-size: 19px;
		line-height: 30px;
	}
</style>
