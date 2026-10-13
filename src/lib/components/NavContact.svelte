<script lang="ts">
	let expanded = $state(false);
	const encodedEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleEmailClick() {
		window.location.href = 'mailto:' + atob(encodedEmail);
	}
</script>

<div class="contact">
	<button
		class="text-button"
		type="button"
		aria-expanded={expanded}
		aria-controls="contact-options"
		onclick={() => (expanded = !expanded)}>Contact</button
	>
	{#if expanded}
		<div id="contact-options" class="contact-options">
			<button class="text-button" onclick={handleEmailClick} type="button"
				>Email</button
			>
			<span aria-hidden="true">/</span>
			<a href="https://linkedin.com/in/tjmgregory">LinkedIn</a>
		</div>
	{/if}
</div>

<style>
	.contact,
	.contact-options {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.contact-options {
		padding-left: 8px;
	}
</style>
