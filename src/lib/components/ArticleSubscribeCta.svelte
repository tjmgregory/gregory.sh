<script lang="ts">
	type Status = 'idle' | 'input' | 'loading' | 'success' | 'error';

	let status = $state<Status>('idle');
	let email = $state('');
	let message = $state('');
	let inputRef: HTMLInputElement | null = null;

	function showEmailInput() {
		status = 'input';
		setTimeout(() => inputRef?.focus(), 50);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			email = '';
			status = 'idle';
		}
	}

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
				message = data.error ?? 'error';
				setTimeout(() => {
					status = 'input';
					message = '';
				}, 2000);
				return;
			}

			status = 'success';
			message = 'subscribed!';
			email = '';
			setTimeout(() => {
				status = 'idle';
				message = '';
			}, 3000);
		} catch {
			status = 'error';
			message = 'error';
			setTimeout(() => {
				status = 'input';
				message = '';
			}, 2000);
		}
	}

	function reset() {
		email = '';
		status = 'idle';
	}
</script>

<aside class="subscribe-cta">
	<div class="border-top">┌<span class="border-line"></span>┐</div>
	<div class="content">
		<p class="prompt">Enjoyed this? Subscribe for more.</p>
		<div class="state-container">
			{#if status === 'idle'}
				<div class="options wipe-in">
					<button class="option" onclick={showEmailInput} type="button">email</button>
					<span class="sep">/</span>
					<a href="/rss.xml" class="option">rss</a>
				</div>
			{:else if status === 'input' || status === 'loading'}
				<form class="input-form wipe-in" onsubmit={handleSubmit}>
					<input
						bind:this={inputRef}
						type="email"
						bind:value={email}
						placeholder="your@email"
						required
						disabled={status === 'loading'}
						onkeydown={handleKeydown}
					/>
					<button type="submit" disabled={status === 'loading'} aria-label="Submit">
						{status === 'loading' ? '..' : '>'}
					</button>
					<button type="button" class="close" onclick={reset} aria-label="Cancel">x</button>
				</form>
			{:else if status === 'success' || status === 'error'}
				<span class="msg wipe-in" class:error={status === 'error'}>{message}</span>
			{/if}
		</div>
	</div>
	<div class="border-bottom">└<span class="border-line"></span>┘</div>
</aside>

<style>
	.subscribe-cta {
		margin-top: 3rem;
		color: var(--matrix-green);
		font-family: var(--font-mono);
	}

	.border-top,
	.border-bottom {
		display: flex;
		align-items: center;
		color: var(--matrix-green-dim);
		font-size: 1rem;
		line-height: 1;
	}

	.border-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(
			90deg,
			var(--matrix-green-dim) 0%,
			var(--matrix-green-dim) 50%,
			transparent 50%,
			transparent 100%
		);
		background-size: 8px 1px;
		margin: 0 2px;
	}

	.content {
		padding: 1.5rem 1rem;
		text-align: center;
	}

	.prompt {
		margin: 0 0 1rem 0;
		color: var(--matrix-green-dim);
	}

	.state-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 1.6rem;
	}

	/* Wipe-in animation */
	.wipe-in {
		animation: wipeIn 0.25s ease-out forwards;
	}

	@keyframes wipeIn {
		from {
			clip-path: inset(0 50% 0 50%);
			opacity: 0.5;
		}
		to {
			clip-path: inset(0 0 0 0);
			opacity: 1;
		}
	}

	/* Options */
	.options {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.option {
		background: none;
		border: none;
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: 1rem;
		padding: 0;
		cursor: pointer;
		transition:
			text-shadow 0.15s ease,
			border-color 0.15s ease;
		border-bottom: 1px solid transparent;
	}

	.option:hover {
		text-shadow: 0 0 10px var(--matrix-green-glow);
		border-bottom-color: var(--matrix-green);
	}

	a.option {
		text-decoration: none;
	}

	.sep {
		color: var(--matrix-green-dim);
	}

	/* Input form */
	.input-form {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.input-form input {
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--matrix-green-dim);
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: 1rem;
		padding: 0 0.2rem;
		width: 12rem;
		max-width: 60vw;
		outline: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.input-form input:focus {
		border-bottom-color: var(--matrix-green);
		box-shadow: 0 1px 0 0 var(--matrix-green-glow);
	}

	.input-form input::placeholder {
		color: var(--matrix-green-dim);
		opacity: 0.5;
	}

	.input-form button {
		background: none;
		border: none;
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: 1rem;
		padding: 0 0.2rem;
		cursor: pointer;
		transition: text-shadow 0.15s ease;
	}

	.input-form button:hover:not(:disabled) {
		text-shadow: 0 0 10px var(--matrix-green-glow);
	}

	.input-form button:disabled {
		color: var(--matrix-green-dim);
		cursor: not-allowed;
	}

	.input-form .close {
		color: var(--matrix-green-dim);
	}

	.input-form .close:hover {
		color: var(--matrix-green);
	}

	/* Messages */
	.msg {
		color: var(--matrix-green);
	}

	.msg.error {
		color: #ff4141;
	}
</style>
