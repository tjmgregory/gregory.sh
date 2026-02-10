<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		datetime: string;
	}

	let { datetime }: Props = $props();

	const date = $derived(new Date(datetime));

	function toLocalIso(d: Date): string {
		const offset = -d.getTimezoneOffset();
		const sign = offset >= 0 ? '+' : '-';
		const pad = (n: number) => String(n).padStart(2, '0');

		const hours = Math.floor(Math.abs(offset) / 60);
		const minutes = Math.abs(offset) % 60;

		return (
			d.getFullYear() +
			'-' +
			pad(d.getMonth() + 1) +
			'-' +
			pad(d.getDate()) +
			'T' +
			pad(d.getHours()) +
			':' +
			pad(d.getMinutes()) +
			':' +
			pad(d.getSeconds()) +
			sign +
			pad(hours) +
			':' +
			pad(minutes)
		);
	}

	const formatted = $derived.by(() => {
		if (!browser) {
			// SSR fallback: show raw ISO timestamp
			return datetime;
		}

		return toLocalIso(date);
	});
</script>

<time {datetime}>{formatted}</time>
