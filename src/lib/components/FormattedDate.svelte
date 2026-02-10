<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		datetime: string;
		format?: 'date' | 'datetime';
	}

	let { datetime, format = 'date' }: Props = $props();

	const date = $derived(new Date(datetime));

	const formatted = $derived.by(() => {
		if (!browser) {
			// SSR fallback: show ISO date portion
			return datetime.split('T')[0];
		}

		const options: Intl.DateTimeFormatOptions =
			format === 'datetime'
				? {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: 'numeric',
						minute: '2-digit'
					}
				: {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					};

		return date.toLocaleDateString(undefined, options);
	});
</script>

<time {datetime}>{formatted}</time>
