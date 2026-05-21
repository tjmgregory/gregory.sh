<script lang="ts">
	const lastUpdated = '21 May 2026';

	// Email encoded to prevent scraping (same as NavContact)
	const encodedEmail = 'c2l0ZUBncmVnb3J5LnNo';

	function handleEmailClick() {
		const email = atob(encodedEmail);
		window.location.href = 'mailto:' + email;
	}
</script>

<svelte:head>
	<title>Privacy Policy | gregory.sh</title>
	<meta name="description" content="Privacy policy for gregory.sh - how I handle your data." />
</svelte:head>

<article class="legal">
	<h1>Privacy Policy</h1>
	<p class="meta">Last updated: {lastUpdated}</p>

	<section>
		<h2>Who I am</h2>
		<p>
			This site is run by Theo Gregory. I'm based in the UK. You can
			<button class="email-link" onclick={handleEmailClick} type="button">contact me</button>.
		</p>
	</section>

	<section>
		<h2>What data I collect</h2>
		<p>If you subscribe to my mailing list, I store your email address and the date you subscribed.</p>
		<p>
			I also run <a href="https://umami.is">Umami</a>, a self-hosted analytics tool, to
			see which posts people read. It collects page views, referrer URLs, browsers,
			operating systems, device types and country of origin. It does not use cookies,
			does not store IP addresses and does not track you across other websites.
		</p>
	</section>

	<section>
		<h2>Why I collect it</h2>
		<p>
			I use your email solely to send you updates about new posts and projects.
			I use the analytics data, in aggregate, to understand which posts are landing.
		</p>
	</section>

	<section>
		<h2>How I store it</h2>
		<p>
			Your email is stored in Cloudflare KV. Analytics data is stored on a server I
			run in Germany (EEA). Neither is shared with third parties.
		</p>
	</section>

	<section>
		<h2>Your rights</h2>
		<p>Under UK GDPR, you have the right to:</p>
		<ul>
			<li><strong>Unsubscribe</strong> at any time via the link in any email, or on the <a href="/unsubscribe">unsubscribe page</a></li>
			<li><strong>Access</strong> your data — <button class="email-link" onclick={handleEmailClick} type="button">email me</button> and I'll confirm what I have</li>
			<li><strong>Delete</strong> your data — unsubscribing removes your email from my list</li>
			<li><strong>Complain</strong> to the <a href="https://ico.org.uk/make-a-complaint/">ICO</a> if you're unhappy with how I've handled your data</li>
		</ul>
	</section>

	<section>
		<h2>Legal basis</h2>
		<p>
			I process your email based on your <strong>consent</strong>, which you give when you subscribe.
			You can withdraw consent at any time by unsubscribing.
		</p>
		<p>
			For analytics, the legal basis is my <strong>legitimate interest</strong> in
			understanding which posts people read. The analytics do not use cookies or
			process personal data, so no consent is required.
		</p>
	</section>

	<section>
		<h2>Changes</h2>
		<p>
			If I make significant changes to this policy, I'll note it at the top.
			The current version was last updated on {lastUpdated}.
		</p>
	</section>
</article>

<style>
	.legal {
		max-width: 600px;
	}

	.meta {
		color: var(--matrix-green-dim);
		font-size: 0.85rem;
		margin-bottom: 2rem;
	}

	section {
		margin: 2rem 0;
	}

	section h2 {
		margin-top: 0;
	}

	ul {
		margin: 1rem 0;
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
