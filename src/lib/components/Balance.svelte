<script lang="ts">
	import type { BalanceResult } from '@socket.tech/socket-v2-sdk';

	import { balances } from '$lib/services/socketTech';

	export let token: BalanceResult;
	let selected: BalanceResult;

	$: sortedBalance = $balances.sort((a: BalanceResult, b: BalanceResult) =>
		a.symbol < b.symbol ? -1 : 1
	);
	// set the first balance as selected once the balances is loaded
	$: if (sortedBalance.length > 0 && !selected) {
		selected = sortedBalance[0];
		token = sortedBalance[0];
	}
</script>

<select class={$$props.class} bind:value={selected} on:change={() => (token = selected)}>
	{#each sortedBalance as balance}
		<option value={balance}>{balance.symbol}</option>
	{/each}
</select>
