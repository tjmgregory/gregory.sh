<script lang="ts">
	import { Seo, FormattedDate } from '$lib';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<Seo url="https://gregory.sh" />

<section class="intro">
	<div class="intro-main">
		<div class="portrait">
			<img src="/theo.jpg" width="64" height="64" alt="Theo Gregory" />
		</div>
		<div class="intro-copy">
			<h1>
				Seven years building software for fintech and healthcare. Now I’m
				learning to find what’s worth building.
			</h1>
			<p class="secondary">
				Led engineering at Elephant Healthcare. Before that, Freetrade.
				First-class M.Sci. in Computer Science.
			</p>
		</div>
	</div>
	<p class="link-row">
		<span>Icebreaker:</span>
		<a class="tap-link" href="/about"
			>I nearly became an actor. Ask me about The IT Crowd →</a
		>
	</p>
</section>

<section class="now-section" aria-labelledby="now-heading">
	<div class="now-row">
		<h2 id="now-heading" class="now-label"><span class="dot"></span>Now</h2>
		<div class="now-copy">
			<p class="lead">
				Testing a few ideas with the people who’d use them, to find the one to
				run at. Reading The Mom Test while I do it.
			</p>
			<a class="tap-link ideas-link" href="/ideas">All my ideas →</a>
		</div>
	</div>
	<p class="link-row">
		<span>More about me:</span>
		<a class="tap-link" href="/about"
			>My career, degree, and the acting years →</a
		>
	</p>
</section>

<section aria-labelledby="writing-heading">
	<div class="section-heading">
		<h2 id="writing-heading">Writing</h2>
		<a class="tap-link" href="/blog">All writing →</a>
	</div>
	<ul class="post-list">
		{#each data.posts.slice(0, 3) as post}
			<li class="post-row">
				<span class="label"><FormattedDate datetime={post.date} /></span>
				<h3><a href="/blog/{post.slug}">{post.title}</a></h3>
			</li>
		{/each}
	</ul>
</section>

<style>
	.intro,
	.intro-main {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.intro-copy {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	h1 {
		font-size: 22px;
		line-height: 30px;
	}
	.portrait {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		position: relative;
		flex-shrink: 0;
		overflow: hidden;
	}
	.portrait::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 10%, transparent);
	}
	.portrait img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.link-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 17px;
		line-height: 26px;
	}
	.link-row > span {
		color: var(--body);
	}
	.now-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.now-row {
		display: grid;
		gap: 2px;
	}
	.now-label {
		display: flex;
		gap: 8px;
		align-items: center;
		font: 500 13px/20px var(--font-mono);
		color: var(--accent);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}
	.ideas-link {
		font-size: 17px;
		line-height: 26px;
	}
	@media (min-width: 600px) {
		.intro {
			gap: 20px;
		}
		.intro-main {
			flex-direction: row;
			gap: 20px;
		}
		.portrait {
			width: 64px;
			height: 64px;
		}
		h1 {
			font-size: 26px;
			line-height: 34px;
		}
		.link-row {
			margin-left: 84px;
			flex-direction: row;
			gap: 5px;
			align-items: baseline;
		}
		.link-row a {
			display: inline;
			min-height: 0;
		}
		.now-section {
			gap: 24px;
		}
		.now-row {
			grid-template-columns: 68px minmax(0, 496px);
			gap: 16px;
		}
		.now-label {
			height: 30px;
		}
	}
</style>
