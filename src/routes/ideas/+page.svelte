<script lang="ts">
	import { Seo } from '$lib';
	import { ideas, ideaGroups, workTools } from '$lib/ideas';
</script>

<Seo
	title="Ideas"
	description="Ideas I’m testing, and how far each has got."
	url="https://gregory.sh/ideas"
/>
<h1 class="page-intro">
	Ideas I’m testing, and how far each has got. I share them because talking
	about an idea is how you find out if it’s any good.
</h1>
<section class="method">
	<h2 class="label">How I test them</h2>
	<p class="secondary">
		I’ve always been quick to build. Now I’m learning to test an idea first:
		talk to the people with the problem, and build only once they want it. The
		Mom Test is my guide. A few I still build first, for fun or to learn a tool.
	</p>
</section>
{#each ideaGroups as group}
	<section class="idea-group" aria-label={group}>
		<h2 class="label">{group}</h2>
		<ol>
			{#each ideas
				.map((idea, index) => ({ ...idea, number: index + 1 }))
				.filter((idea) => idea.group === group) as idea}
				<li value={idea.number}>
					<span class="number label" aria-hidden="true"
						>{String(idea.number).padStart(2, '0')}</span
					>
					<div class="idea-copy">
						<h3 class="lead">{idea.name}</h3>
						<p class="secondary">{idea.description}</p>
						<p class="label">{idea.meta}</p>
					</div>
					{#if idea.link}<a
							class="idea-link mono tap-link"
							href={idea.link.href}>{idea.link.label} →</a
						>{/if}
				</li>
			{/each}
		</ol>
	</section>
{/each}
<section class="work-tools">
	<h2 class="label">Built for my own work</h2>
	<p class="secondary">
		Tools I made for my own work. Each has a post on how and why.
	</p>
	<div class="tool-links">
		{#each workTools as tool}<a class="tap-link" href="/blog/{tool.slug}"
				>{tool.name} →</a
			>{/each}
	</div>
</section>

<style>
	.method,
	.work-tools {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.method p {
		max-width: 560px;
	}
	.idea-group {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	ol {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr);
		column-gap: 16px;
	}
	.number {
		line-height: 28px;
	}
	.idea-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.idea-link {
		grid-column: 2;
	}
	.tool-links {
		display: flex;
		flex-wrap: wrap;
		column-gap: 24px;
		font-size: 17px;
	}
	@media (min-width: 600px) {
		li {
			grid-template-columns: 28px minmax(0, 1fr) 160px;
		}
		.number {
			padding-top: 7px;
			line-height: 30px;
		}
		.idea-copy {
			padding-top: 7px;
		}
		.idea-link {
			align-self: start;
			grid-column: 3;
			justify-self: end;
			text-align: right;
		}
	}
</style>
