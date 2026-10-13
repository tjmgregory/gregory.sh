<script lang="ts">
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { TURNSTILE_ACTIONS, TURNSTILE_SITE_KEY } from '$lib/turnstile-config';

	type TurnstileHandle = { reset: () => void };

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstile = $state<TurnstileHandle>();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
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
			message = data.message ?? 'Subscribed!';
			email = '';
		} catch {
			status = 'error';
			message = 'Failed to subscribe. Please try again.';
		} finally {
			turnstile?.reset();
		}
	}
</script>

<form onsubmit={handleSubmit} class="subscribe-form">
	{#if status === 'success'}
		<p class="success" role="status">{message}</p>
	{:else}
		<input
			type="email"
			bind:value={email}
			placeholder="Email address"
			aria-label="Email address"
			autocomplete="email"
			required
			disabled={status === 'loading'}
		/>
		<button type="submit" disabled={status === 'loading' || !turnstileToken}>
			{status === 'loading' ? 'Subscribing...' : 'Subscribe'}
		</button>
		<Turnstile
			bind:this={turnstile}
			siteKey={TURNSTILE_SITE_KEY}
			action={TURNSTILE_ACTIONS.subscribe}
			onToken={(token) => (turnstileToken = token)}
			onError={() => {
				status = 'error';
				message = 'Verification could not load. Please try again.';
			}}
			class="turnstile"
			theme="auto"
		/>
		{#if status === 'error'}
			<p class="error" role="alert">{message}</p>
		{/if}
	{/if}
</form>

<style>
	.subscribe-form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	input,
	button {
		width: 100%;
	}
	:global(.turnstile) {
		flex-basis: 100%;
		width: 100%;
	}
	.error {
		width: 100%;
	}
	@media (min-width: 600px) {
		input {
			width: 320px;
		}
		button {
			width: auto;
		}
	}
</style>
