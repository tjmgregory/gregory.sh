<script lang="ts">
	import { page } from '$app/stores';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { TURNSTILE_ACTIONS, TURNSTILE_SITE_KEY } from '$lib/turnstile-config';
	import { readTokenEmail } from '$lib/unsubscribe-token';

	type Status = 'idle' | 'loading' | 'success' | 'error';
	type TurnstileHandle = { reset: () => void };

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstile = $state<TurnstileHandle>();
	let token = $state<string | null>(null);
	let tokenEmail = $state('');

	// Email encoded to prevent scraping (same as NavContact)
	const encodedContactEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleContactClick() {
		const contactEmail = atob(encodedContactEmail);
		window.location.href = 'mailto:' + contactEmail;
	}

	// Runs in the browser only, so neither the token nor the address it carries
	// reaches the served HTML.
	$effect(() => {
		const params = $page.url.searchParams;
		token = params.get('token');
		tokenEmail = token ? (readTokenEmail(token) ?? '') : '';

		const urlEmail = params.get('email');
		if (!token && urlEmail) {
			email = urlEmail;
		}
	});

	async function send(url: string, body?: string) {
		status = 'loading';

		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: body ? { 'Content-Type': 'application/json' } : undefined,
				body
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

	function handleConfirm() {
		if (!token) return;
		send(`/api/unsubscribe?token=${encodeURIComponent(token)}`);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) return;
		send('/api/unsubscribe', JSON.stringify({ email, turnstileToken }));
	}
</script>

<svelte:head>
	<title>Unsubscribe | gregory.sh</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="unsubscribe">
	<h1>Unsubscribe</h1>

	{#if status === 'success'}
		<div class="result success">
			<p>{message}</p>
			<p class="note">You won't receive any more emails from me.</p>
		</div>
	{:else if status === 'error'}
		<div class="result error">
			<p>{message}</p>
			{#if !token}
				<button onclick={() => (status = 'idle')}>Try again</button>
			{/if}
		</div>
	{:else if token}
		<p>
			{#if tokenEmail}
				Unsubscribe <span class="address">{tokenEmail}</span> from the mailing list?
			{:else}
				Unsubscribe from the mailing list?
			{/if}
		</p>

		<button onclick={handleConfirm} disabled={status === 'loading'}>
			{status === 'loading' ? 'Removing...' : 'Confirm unsubscribe'}
		</button>
	{:else}
		<p>Enter your email to unsubscribe from the mailing list.</p>

		<form onsubmit={handleSubmit}>
			<input
				type="email"
				bind:value={email}
				placeholder="your@email"
				required
				disabled={status === 'loading'}
			/>
			<Turnstile
				bind:this={turnstile}
				siteKey={TURNSTILE_SITE_KEY}
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
			Questions? <button class="email-link" onclick={handleContactClick} type="button">Contact me</button>
		</p>
	{/if}
</article>

<style>
	.unsubscribe {
		max-width: 400px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 2rem 0;
	}

	input {
		background: transparent;
		border: 1px solid var(--matrix-green-dim);
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: 1rem;
		padding: 0.75rem 1rem;
		outline: none;
		transition: border-color 0.15s ease;
	}

	input:focus {
		border-color: var(--matrix-green);
	}

	input::placeholder {
		color: var(--matrix-green-dim);
		opacity: 0.6;
	}

	button {
		background: var(--matrix-green-dim);
		border: none;
		color: var(--matrix-black);
		font-family: var(--font-mono);
		font-size: 1rem;
		padding: 0.75rem 1rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	button:hover:not(:disabled) {
		background: var(--matrix-green);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.result {
		margin: 2rem 0;
		padding: 1.5rem;
		border: 1px solid var(--matrix-green-dim);
	}

	.result p {
		margin: 0;
	}

	.result.success {
		border-color: var(--matrix-green);
	}

	.result.error {
		border-color: #ff4141;
	}

	.result.error p {
		color: #ff4141;
	}

	.result button {
		margin-top: 1rem;
	}

	.note {
		color: var(--matrix-green-dim);
		font-size: 0.85rem;
	}

	.address {
		color: var(--matrix-green);
	}

	.email-link {
		background: none;
		border: none;
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: inherit;
		padding: 0;
		cursor: pointer;
		border-bottom: 1px solid var(--matrix-green-dim);
		transition: text-shadow 0.2s ease;
	}

	.email-link:hover {
		text-shadow: 0 0 10px var(--matrix-green-glow);
	}
</style>
