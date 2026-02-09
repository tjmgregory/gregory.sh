<script lang="ts">
	type State = 'idle' | 'expanded' | 'input' | 'loading' | 'success' | 'error';

	let state: State = $state('idle');
	let email = $state('');
	let message = $state('');
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
	let inputRef: HTMLInputElement | null = null;

	function handleMouseEnter() {
		if (state === 'idle') {
			if (hoverTimeout) clearTimeout(hoverTimeout);
			state = 'expanded';
		}
	}

	function handleMouseLeave() {
		if (state === 'expanded') {
			hoverTimeout = setTimeout(() => {
				if (state === 'expanded') {
					state = 'idle';
				}
			}, 300);
		}
	}

	function showEmailInput() {
		state = 'input';
		setTimeout(() => inputRef?.focus(), 50);
	}

	function handleInputBlur() {
		if (state === 'input' && !email.trim()) {
			setTimeout(() => {
				if (state === 'input' && !email.trim()) {
					state = 'idle';
				}
			}, 150);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			email = '';
			state = 'idle';
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) return;

		state = 'loading';

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();

			if (!res.ok) {
				state = 'error';
				message = data.error || 'error';
				setTimeout(() => {
					state = 'input';
					message = '';
				}, 2000);
				return;
			}

			state = 'success';
			message = 'subscribed';
			email = '';
			setTimeout(() => {
				state = 'idle';
				message = '';
			}, 2000);
		} catch {
			state = 'error';
			message = 'error';
			setTimeout(() => {
				state = 'input';
				message = '';
			}, 2000);
		}
	}

	function reset() {
		email = '';
		state = 'idle';
	}
</script>

<div
	class="nav-subscribe"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label="Subscribe options"
>
	<!-- All states stack in same position, animate with wipe -->
	<div class="state-container">
		{#if state === 'idle'}
			<span class="content wipe-in">subscribe</span>
		{:else if state === 'expanded'}
			<div class="content options wipe-in">
				<button class="option" onclick={showEmailInput} type="button">email</button>
				<span class="sep">/</span>
				<a href="/rss.xml" class="option">rss</a>
			</div>
		{:else if state === 'input' || state === 'loading'}
			<form class="content input-form wipe-in" onsubmit={handleSubmit}>
				<input
					bind:this={inputRef}
					type="email"
					bind:value={email}
					placeholder="your@email"
					required
					disabled={state === 'loading'}
					onblur={handleInputBlur}
					onkeydown={handleKeydown}
				/>
				<button type="submit" disabled={state === 'loading'} aria-label="Submit">
					{state === 'loading' ? '..' : '>'}
				</button>
				<button type="button" class="close" onclick={reset} aria-label="Cancel">x</button>
			</form>
		{:else if state === 'success' || state === 'error'}
			<span class="content msg wipe-in" class:error={state === 'error'}>{message}</span>
		{/if}
	</div>
</div>

<style>
	.nav-subscribe {
		position: relative;
	}

	.state-container {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		min-width: 10rem;
		height: 1.6rem; /* Fixed height prevents vertical shift */
	}

	.content {
		white-space: nowrap;
		line-height: 1.6;
	}

	/* Wipe-in animation from right (since right-aligned) */
	.wipe-in {
		animation: wipeIn 0.25s ease-out forwards;
	}

	@keyframes wipeIn {
		from {
			clip-path: inset(0 0 0 100%);
			opacity: 0.5;
		}
		to {
			clip-path: inset(0 0 0 0);
			opacity: 1;
		}
	}

	/* Idle state */
	.state-container > span:not(.msg) {
		color: var(--matrix-green-dim);
		cursor: default;
		transition: color 0.15s ease, text-shadow 0.15s ease;
	}

	.nav-subscribe:hover .state-container > span:not(.msg) {
		color: var(--matrix-green);
		text-shadow: 0 0 10px var(--matrix-green-glow);
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
		transition: text-shadow 0.15s ease, border-color 0.15s ease;
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
		width: 9rem;
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
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
