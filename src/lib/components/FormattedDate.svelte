<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		datetime: string;
	}

	let { datetime }: Props = $props();

	const date = $derived(new Date(datetime));

	const formatted = $derived.by(() => {
		if (!browser) {
			// SSR fallback: show ISO timestamp
			return datetime;
		}

		return date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	});
</script>

<time {datetime}>{formatted}</time>
