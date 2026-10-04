<script lang="ts">
	import { prices } from '#lib/services/prices.svelte.ts';

	const usd = $derived(prices.currency === 'USD');
</script>

<button
	type="button"
	class="btn-icon font-bold text-surface-600-400 transition-colors hover:preset-tonal hover:text-surface-950-50"
	title={usd ? 'Show reward values in euros' : 'Show reward values in US dollars'}
	aria-label="Toggle euro / US dollar values"
	onclick={() => (prices.currency = usd ? 'EUR' : 'USD')}
>
	{usd ? '$' : '€'}
</button>
