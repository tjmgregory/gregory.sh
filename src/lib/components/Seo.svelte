<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		url?: string;
		image?: string;
		type?: 'website' | 'article';
		publishedTime?: string;
	}

	const site = 'https://gregory.sh';
	const siteName = 'gregory.sh';
	const defaultDescription = 'Building in public - thoughts on software, startups, and making things.';

	let {
		title,
		description = defaultDescription,
		url = site,
		image = `${site}/og-image.png`,
		type = 'website',
		publishedTime
	}: Props = $props();

	const fullTitle = $derived(title ? `${title} | ${siteName}` : siteName);
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

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
