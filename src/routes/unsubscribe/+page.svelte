<script lang="ts">
	import { page } from '$app/stores';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { TURNSTILE_ACTIONS, TURNSTILE_SITE_KEY } from '$lib/turnstile-config';

	type Status = 'idle' | 'loading' | 'success' | 'error';
	type TurnstileHandle = { reset: () => void };

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstile = $state<TurnstileHandle>();
	let token = $state<string | null>(null);

	// Email encoded to prevent scraping (same as NavContact)
	const encodedContactEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleContactClick() {
		const contactEmail = atob(encodedContactEmail);
		window.location.href = 'mailto:' + contactEmail;
	}

	$effect(() => {
		const params = $page.url.searchParams;
		token = params.get('token');

		const urlEmail = params.get('email');
		if (!token && urlEmail) {
			email = urlEmail;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) return;

		status = 'loading';

		try {
			const res = await fetch('/api/unsubscribe', {
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

			// Fire on every successful submit. Same trade-off as subscribe: the server
			// cannot signal "real removal vs unknown email" without leaking membership.
			window.umami?.track('newsletter_unsubscribe');

			status = 'success';
			message = data.message ?? 'Unsubscribed';
		} catch {
			status = 'error';
			message = 'Something went wrong';
		} finally {
			turnstile?.reset();
		}
	}
</script>

<svelte:head>
	<title>Unsubscribe | gregory.sh</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="unsubscribe">
	<h1>Unsubscribe</h1>

	{#if token}
		<p>Unsubscribe this address from the mailing list?</p>

		<!-- Real form submission, not fetch: the server's own response page
		     (the confirmation a mail-client POST also gets) is what shows. -->
		<form
			method="POST"
			action="/api/unsubscribe?token={encodeURIComponent(token)}"
		>
			<button type="submit">Unsubscribe</button>
		</form>
	{:else if status === 'success'}
		<div class="result success">
			<p>{message}</p>
			<p class="note">You won't receive any more emails from me.</p>
		</div>
	{:else if status === 'error'}
		<div class="result error">
			<p>{message}</p>
			<button onclick={() => (status = 'idle')}>Try again</button>
		</div>
	{:else}
		<p>Enter your email to unsubscribe from the mailing list.</p>

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
				action={TURNSTILE_ACTIONS.unsubscribe}
				onToken={(token) => (turnstileToken = token)}
				onError={() => {
					status = 'error';
					message = 'Verification could not load. Please try again.';
				}}
			/>
			<button type="submit" disabled={status === 'loading' || !turnstileToken}>
				{status === 'loading' ? 'Removing...' : 'Unsubscribe'}
			</button>
		</form>

		<p class="note">
			Questions? <button
				class="text-button"
				onclick={handleContactClick}
				type="button">Contact me</button
			>
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
	.result p + p,
	.result button {
		margin-top: 16px;
	}
</style>
