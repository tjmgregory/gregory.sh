<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		url?: string;
		image?: string;
		type?: 'website' | 'article';
		publishedTime?: string;
		modifiedTime?: string;
	}

	const site = 'https://gregory.sh';
	const siteName = 'gregory.sh';
	const tagline = 'Building Startups with AI Agents';
	const defaultDescription =
		'Theo Gregory builds companies with AI agents. Ex-Head of Engineering sharing real lessons on AI-assisted development, solo startups, and shipping fast.';

	const author = {
		name: 'Theo Gregory',
		url: site
	};

	const publisher = {
		name: siteName,
		url: site,
		logo: `${site}/logo.png`
	};

	let {
		title,
		description = defaultDescription,
		url = site,
		image = `${site}/og-image.png`,
		type = 'website',
		publishedTime,
		modifiedTime
	}: Props = $props();

	// Homepage gets tagline, other pages get "Page | siteName"
	const isHomepage = $derived(url === site || url === `${site}/`);
	const fullTitle = $derived(
		title ? `${title} | ${siteName}` : `${siteName} — ${tagline}`
	);

	// JSON-LD structured data
	const jsonLd = $derived.by(() => {
		if (type === 'article' && title) {
			// Article schema for blog posts
			return JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'Article',
				headline: title,
				description: description,
				image: image,
				url: url,
				datePublished: publishedTime,
				dateModified: modifiedTime ?? publishedTime,
				author: {
					'@type': 'Person',
					name: author.name,
					url: author.url
				},
				publisher: {
					'@type': 'Organization',
					name: publisher.name,
					url: publisher.url,
					logo: {
						'@type': 'ImageObject',
						url: publisher.logo
					}
				},
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': url
				}
			});
		}

		if (isHomepage) {
			// Person + WebSite schema for homepage
			return JSON.stringify([
				{
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					name: siteName,
					url: site,
					description: defaultDescription,
					author: {
						'@type': 'Person',
						name: author.name
					}
				},
				{
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: author.name,
					url: site,
					jobTitle: 'Software Engineer & Founder',
					description: defaultDescription,
					sameAs: [
						'https://github.com/thgregory',
						'https://x.com/thgregory'
					]
				}
			]);
		}

		return null;
	});
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	<!-- JSON-LD Structured Data -->
	{#if jsonLd}
		{@html `<script type="application/ld+json">${jsonLd}</script>`}
	{/if}
</svelte:head>
