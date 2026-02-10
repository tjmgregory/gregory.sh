<script lang="ts">
	import type { PageData } from './$types';
	import { Seo, FormattedDate, introComplete, shouldAnimateFadeIn } from '$lib';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	const WELCOME_LINES = ["Hey, I'm Theo.", 'Welcome to the build.'];
	const WELCOME_TEXT = WELCOME_LINES.join('\n');
	const TYPING_SPEED = 70; // ms per character
	const PUNCTUATION_PAUSE = 250; // extra pause after , or .
	const INITIAL_DELAY = 1000; // cursor blink before typing
	const POST_TYPING_DELAY = 500; // pause after typing

	let typedText = $state('');
	let showCursor = $state(true);
	let isTyping = $state(false);
	let introStarted = $state(false);

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function runIntro(): Promise<void> {
		if (introStarted) return;
		introStarted = true;
		isTyping = true;

		// Phase 1: Just the blinking cursor for a second
		await sleep(INITIAL_DELAY);

		// Phase 2: Type out the welcome message
		for (let i = 0; i <= WELCOME_TEXT.length; i++) {
			typedText = WELCOME_TEXT.slice(0, i);
			const justTyped = WELCOME_TEXT[i - 1];
			await sleep(TYPING_SPEED);
			// Pause after punctuation for natural rhythm
			if (justTyped === ',' || justTyped === '.') {
				await sleep(PUNCTUATION_PAUSE);
			}
		}

		// Phase 3: Short pause
		await sleep(POST_TYPING_DELAY);

		// Phase 4: Complete intro - trigger fade in
		isTyping = false;
		shouldAnimateFadeIn.set(true);
		introComplete.set(true);
	}

	afterNavigate(({ from }) => {
		if (browser && from === null) {
			// This is a fresh page load (not navigation from another page)
			introComplete.set(false);
			shouldAnimateFadeIn.set(false);
			typedText = '';
			runIntro();
		} else {
			// Navigation from another page - show full content immediately
			typedText = WELCOME_TEXT;
			introComplete.set(true);
			shouldAnimateFadeIn.set(false);
		}
	});
</script>

<Seo url="https://gregory.sh" />

<p class="welcome-text">
	{#if isTyping || !$introComplete}
		{typedText}
	{:else}
		{WELCOME_TEXT}
	{/if}
	{#if showCursor}
		<span class="cursor"></span>
	{/if}
</p>

<div class:invisible={!$introComplete} class:fade-in={$shouldAnimateFadeIn && $introComplete}>
	<h2>Latest transmissions</h2>

	{#if data.posts.length === 0}
		<p>No posts yet. The Matrix is silent.</p>
	{:else}
		<ul class="post-list">
			{#each data.posts as post}
				<li class="post-item">
					<span class="post-date"><FormattedDate datetime={post.date} /></span>
					<h3 class="post-title">
						<a href="/blog/{post.slug}">{post.title}</a>
					</h3>
					<p class="post-description">{post.description}</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.welcome-text {
		margin: 0;
		white-space: pre-line;
	}

	.invisible {
		opacity: 0;
		pointer-events: none;
	}

	.fade-in {
		animation: fadeIn 0.6s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
