<script lang="ts">
	type Status = 'idle' | 'loading' | 'success' | 'error';

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) return;

		status = 'loading';

		try {
			const res = await fetch('/api/subscribe', {
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

			// Fire on every successful submit. Same trade-off as NavSubscribe: the
			// server cannot signal "new vs duplicate" without leaking membership.
			window.umami?.track('newsletter_subscribe');

			status = 'success';
			message = data.message ?? 'Subscribed';
			email = '';
		} catch {
			status = 'error';
			message = 'Something went wrong';
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
	<h1>Subscribe</h1>

	{#if status === 'success'}
		<div class="result success">
			<p>{message}</p>
			<p class="note">Next post lands in your inbox.</p>
		</div>
	{:else}
		<p>
			Expectant solofounder with vision larger than sense. Follow along to get early
			access to all that pours out and share in the lessons learned along the way.
		</p>

		<form onsubmit={handleSubmit}>
			<input
				type="email"
				bind:value={email}
				placeholder="your@email"
				required
				disabled={status === 'loading'}
			/>
			<button type="submit" disabled={status === 'loading'}>
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
			<a href="/privacy">Privacy policy</a> · <a href="/unsubscribe">Unsubscribe anytime</a>
		</p>
	{/if}
</article>

<style>
	.subscribe {
		max-width: 480px;
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
		border: 1px solid var(--matrix-green);
	}

	.result p {
		margin: 0;
	}

	.error-msg {
		color: #ff4141;
	}

	.note {
		color: var(--matrix-green-dim);
		font-size: 0.85rem;
	}
</style>
