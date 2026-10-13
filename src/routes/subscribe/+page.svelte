<script lang="ts">
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { TURNSTILE_ACTIONS, TURNSTILE_SITE_KEY } from '$lib/turnstile-config';

	type Status = 'idle' | 'loading' | 'success' | 'error';
	type TurnstileHandle = { reset: () => void };

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstile = $state<TurnstileHandle>();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) return;

		status = 'loading';

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, turnstileToken })
			});

			const data = (await res.json()) as { error?: string; message?: string };

			if (!res.ok) {
				status = 'error';
				message = data.error ?? 'Something went wrong';
				return;
			}

			// Fire on every successful submit. Same trade-off as NavSubscribe: the
			// server cannot signal "new vs duplicate" without leaking membership.
			window.umami?.track('newsletter_subscribe');

			status = 'success';
			message = data.message ?? 'Subscribed';
			email = '';
		} catch {
			status = 'error';
			message = 'Something went wrong';
		} finally {
			turnstile?.reset();
		}
	}
</script>

<svelte:head>
	<title>Subscribe | gregory.sh</title>
	<meta
		name="description"
		content="Get new posts by email. I write about building software with agents, and the businesses I am building with it."
	/>
</svelte:head>

<article class="subscribe">
	<h1>Newsletter</h1>

	{#if status === 'success'}
		<div class="result success">
			<p>{message}</p>
			<p class="note">Next post lands in your inbox.</p>
		</div>
	{:else}
		<p>What I’m building, what I’m learning, and which idea I pick.</p>

		<form onsubmit={handleSubmit}>
			<input
				type="email"
				bind:value={email}
				placeholder="Email address"
				aria-label="Email address"
				autocomplete="email"
				required
				disabled={status === 'loading'}
			/>
			<Turnstile
				bind:this={turnstile}
				siteKey={TURNSTILE_SITE_KEY}
				theme="auto"
				action={TURNSTILE_ACTIONS.subscribe}
				onToken={(token) => (turnstileToken = token)}
				onError={() => {
					status = 'error';
					message = 'Verification could not load. Please try again.';
				}}
			/>
			<button type="submit" disabled={status === 'loading' || !turnstileToken}>
				{status === 'loading' ? 'Subscribing...' : 'Subscribe'}
			</button>
		</form>

		{#if status === 'error'}
			<p class="error-msg">{message}</p>
		{/if}

		<p class="note">
			Prefer a reader? <a href="/rss.xml">RSS</a> works too.
		</p>

		<p class="note">
			<a href="/privacy">Privacy policy</a> ·
			<a href="/unsubscribe">Unsubscribe anytime</a>
		</p>
	{/if}
</article>

<style>
	article > p {
		margin-top: 16px;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 24px 0;
		max-width: 448px;
	}
	.result {
		margin: 24px 0;
	}
	.result p + p {
		margin-top: 16px;
	}
</style>
