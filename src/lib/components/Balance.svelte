<script lang="ts">
	import type { BalanceResult } from '@socket.tech/socket-v2-sdk';

	import { balances } from '$lib/services/socketTech';

	export let token: BalanceResult;
	export let amount: number = 0;

	let selected: BalanceResult;

	$: sortedBalance = $balances.sort((a: BalanceResult, b: BalanceResult) =>
		a.symbol < b.symbol ? -1 : 1
	);
	// set the first balance as selected once the balances is loaded
	$: if (sortedBalance.length > 0 && !selected) {
		selected = sortedBalance[0];
		token = sortedBalance[0];
	}
	$: amountStr = amount.toString();
	const setMax = () => {
		amount = selected?.amount || 0;
	};
	const onChangeToken = () => {
		token = selected;
		amount = 0;
	};
</script>

<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
	<button class="input-group-shim" on:click={setMax}>Max</button>
	<input placeholder="Reward amount" bind:value={amountStr} step="any" min="0" />
	<select bind:value={selected} on:change={onChangeToken}>
		{#each sortedBalance as balance}
			<option value={balance}>{balance.symbol} </option>
		{/each}
	</select>
</div>
