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
	<!-- Always render label to reserve space, hide when expanded -->
	<span class="label" class:hidden={status === 'expanded'}>contact</span>
	<!-- Options positioned absolutely to avoid layout shift -->
	{#if status === 'expanded'}
		<div class="options wipe-in">
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

<style>
	.nav-contact {
		position: relative;
	}

	/* Label always reserves space */
	.label {
		color: var(--matrix-green-dim);
		cursor: default;
		transition: color 0.15s ease, text-shadow 0.15s ease;
		white-space: nowrap;
	}

	.label.hidden {
		visibility: hidden;
	}

	.nav-contact:hover .label:not(.hidden) {
		color: var(--matrix-green);
		text-shadow: 0 0 10px var(--matrix-green-glow);
	}

	/* Options overlay - positioned absolutely */
	.options {
		position: absolute;
		left: 0;
		top: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	/* Wipe-in animation from left */
	.wipe-in {
		animation: wipeIn 0.25s ease-out forwards;
	}

	@keyframes wipeIn {
		from {
			clip-path: inset(0 100% 0 0);
			opacity: 0.5;
		}
		to {
			clip-path: inset(0 0 0 0);
			opacity: 1;
		}
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
</style>
