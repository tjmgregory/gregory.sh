<script lang="ts">
	import { page } from '$app/stores';

	type Status = 'idle' | 'loading' | 'success' | 'error';

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');

	// Email encoded to prevent scraping (same as NavContact)
	const encodedContactEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleContactClick() {
		const contactEmail = atob(encodedContactEmail);
		window.location.href = 'mailto:' + contactEmail;
	}

	// Check for email in URL params (from email links)
	$effect(() => {
		const urlEmail = $page.url.searchParams.get('email');
		if (urlEmail) {
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
				body: JSON.stringify({ email })
			});

			const data = (await res.json()) as { error?: string; message?: string };

			if (!res.ok) {
				status = 'error';
				message = data.error ?? 'Something went wrong';
				return;
			}

			status = 'success';
			message = data.message ?? 'Unsubscribed';
		} catch {
			status = 'error';
			message = 'Something went wrong';
		}
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
			<button onclick={() => (status = 'idle')}>Try again</button>
		</div>
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
			<button type="submit" disabled={status === 'loading'}>
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
