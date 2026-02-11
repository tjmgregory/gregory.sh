<script lang="ts">
	type Status = 'idle' | 'expanded';

	let status = $state<Status>('idle');
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

	// Email encoded as base64 to prevent scraping
	const encodedEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleMouseEnter() {
		if (status === 'idle') {
			if (hoverTimeout) clearTimeout(hoverTimeout);
			status = 'expanded';
		}
	}

	function handleMouseLeave() {
		if (status === 'expanded') {
			hoverTimeout = setTimeout(() => {
				if (status === 'expanded') {
					status = 'idle';
				}
			}, 300);
		}
	}

	function handleEmailClick() {
		// Decode and navigate - email never stored in DOM
		const email = atob(encodedEmail);
		window.location.href = 'mailto:' + email;
	}
</script>

<div
	class="nav-contact"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label="Contact options"
>
	<div class="state-container">
		{#if status === 'idle'}
			<span class="label wipe-in wipe-in--left">contact</span>
		{:else}
			<div class="options wipe-in wipe-in--left">
				<button class="option" onclick={handleEmailClick} type="button">email</button>
				<span class="sep">/</span>
				<a
					href="https://linkedin.com/in/tjmgregory"
					class="option"
					target="_blank"
					rel="noopener noreferrer">linkedin</a
				>
			</div>
		{/if}
	</div>
</div>

<style>
	.nav-contact {
		position: relative;
	}

	.state-container {
		display: flex;
		align-items: center;
		height: 1.6rem;
	}

	/* Desktop: restore min-width for layout stability */
	@media (min-width: 600px) {
		.state-container {
			min-width: 7rem;
		}
	}

	.label {
		color: var(--matrix-green-dim);
		cursor: default;
		transition: color 0.15s ease, text-shadow 0.15s ease;
		white-space: nowrap;
		line-height: 1.6;
		border-bottom: 1px solid transparent;
	}

	.nav-contact:hover .label {
		color: var(--matrix-green);
		text-shadow: 0 0 10px var(--matrix-green-glow);
	}

	.options {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.option {
		background: none;
		border: none;
		color: var(--matrix-green);
		font-family: var(--font-mono);
		font-size: 1rem;
		line-height: 1.6;
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
		line-height: 1.6;
		border-bottom: 1px solid transparent;
	}
</style>
