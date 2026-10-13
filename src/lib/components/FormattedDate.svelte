<script lang="ts">
	let {
		datetime,
		format = 'month-year'
	}: { datetime: string; format?: 'month-year' | 'month' | 'full' } = $props();
	const formatted = $derived(
		new Intl.DateTimeFormat('en-GB', {
			month: 'short',
			...(format !== 'month' && { year: 'numeric' }),
			...(format === 'full' && { day: 'numeric' }),
			timeZone: 'Europe/London'
		}).format(new Date(datetime))
	);
</script>

<time {datetime}>{formatted}</time>
