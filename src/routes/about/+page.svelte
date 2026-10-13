<script lang="ts">
	import { Seo } from '$lib';
	const history = [
		[
			'2024',
			'Head of Engineering at Elephant Healthcare',
			'Led a team of 8 across engineering and product. Our clinic software reached 100k patients in 3 countries across Africa and Asia.'
		],
		[
			'2021',
			'Engineer, then senior engineer, at Elephant Healthcare',
			'Cut deploy time from 42 minutes to 7, and led the work to make the app run offline.'
		],
		[
			'2019',
			'Engineer at Freetrade, the commission-free trading app',
			'Moved the trading platform from Firebase to Google Cloud with no downtime. Promoted twice in 18 months.'
		],
		[
			'2019',
			'A First in Computer Science (M.Sci.) at the University of Birmingham',
			'My dissertation built a notification system that learns when to interrupt you.'
		],
		[
			'Uni',
			'Led a team of 10 students building a chat app for Channel 4’s The Gadget Show',
			''
		],
		['Uni', 'Finalist, TargetJobs Undergraduate of the Year', ''],
		[
			'Stage',
			'National Youth Theatre, and Grade 8 in Acting and Musical Theatre Singing',
			''
		],
		['Screen', 'A part in The IT Crowd, and the lead in a TV pilot', ''],
		['Teaching', 'A year as a paid drama teacher in Birmingham', ''],
		['2014', 'International Baccalaureate, 40 out of 45', '']
	];
</script>

<Seo
	title="About"
	description="Seven years of engineering, and a few other things along the way."
	url="https://gregory.sh/about"
/>
<h1 class="page-intro">
	Seven years of engineering, and a few other things along the way.
</h1>
<ul class="ledger">
	{#each history as [label, line, detail]}
		<li class="ledger-row">
			<span class="label">{label}</span>
			<div>
				<p class="lead">{line}</p>
				{#if detail}<p class="secondary">{detail}</p>{/if}
			</div>
		</li>
	{/each}
</ul>
<section class="off-work">
	<h2 class="label">Off work</h2>
	<p class="lead">Cooking, Back-country skiing, Film and theatre.</p>
</section>
<p><a class="mono tap-link" href="/">← Back to the main story</a></p>

<style>
	.page-intro {
		max-width: 580px;
	}
	.off-work {
		border-top: 1px solid var(--hairline);
		padding-top: 32px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
