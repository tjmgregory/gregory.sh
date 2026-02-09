<script lang="ts">
	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'loading';

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();

			if (!res.ok) {
				status = 'error';
				message = data.error || 'Something went wrong';
				return;
			}

			status = 'success';
			message = data.message;
			email = '';
		} catch {
			status = 'error';
			message = 'Failed to subscribe. Please try again.';
		}
	}
</script>

<form onsubmit={handleSubmit} class="subscribe-form">
	{#if status === 'success'}
		<p class="success">{message}</p>
	{:else}
		<input
			type="email"
			bind:value={email}
			placeholder="your@email.com"
			required
			disabled={status === 'loading'}
		/>
		<button type="submit" disabled={status === 'loading'}>
			{status === 'loading' ? 'Subscribing...' : 'Subscribe'}
		</button>
		{#if status === 'error'}
			<p class="error">{message}</p>
		{/if}
	{/if}
</form>

<style>
	.subscribe-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	input {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		background: #333;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	button:hover:not(:disabled) {
		background: #555;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.success {
		color: green;
	}

	.error {
		color: red;
		width: 100%;
	}
</style>
