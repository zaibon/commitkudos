<script lang="ts">
	import { balances } from '$lib/services/balances';
	import type { Balance } from '$lib/types';

	export let token: Balance;
	export let amount: number = 0;

	let selected: Balance;
	let sortedBalance: Balance[];
	balances.subscribe((value) => {
		sortedBalance = $balances.sort((a, b) => (a.symbol < b.symbol ? -1 : 1));
		selected = value[0];
		token = value[0];
	});

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
	<input placeholder="Reward amount" bind:value={amount} type="number" step="any" min="0" />
	<select bind:value={selected} on:change={onChangeToken}>
		{#each sortedBalance as balance}
			<option value={balance}>{balance.symbol} </option>
		{/each}
	</select>
</div>
