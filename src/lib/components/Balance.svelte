<script lang="ts">
	import { untrack } from 'svelte';

	import { balances } from '#lib/services/balances.svelte.ts';
	import { PRICE_SOURCE, prices } from '#lib/services/prices.svelte.ts';
	import { wallet } from '#lib/services/wallet.svelte.ts';
	import type { Balance } from '#lib/types.ts';

	let {
		token = $bindable(),
		amount = $bindable(0)
	}: {
		token?: Balance;
		amount?: number;
	} = $props();

	const sameToken = (a?: Balance, b?: Balance) =>
		!!a && !!b && a.address === b.address && a.chainId === b.chainId;

	// default to the first token, and reset when the selected token disappears (chain/account switch)
	$effect(() => {
		const list = balances.list;
		untrack(() => {
			if (!list.some((b) => sameToken(b, token))) {
				token = list[0];
			}
		});
	});

	const price = $derived(prices.eur(token));
	const amountEur = $derived(price !== undefined && amount > 0 ? amount * price : undefined);
	const balanceEur = $derived(price !== undefined && token ? token.amount * price : undefined);

	const eurFormat = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const formatEur = (value: number) =>
		value > 0 && value < 0.01 ? '< 0.01 €' : `${eurFormat.format(value)} €`;

	const setMax = () => {
		amount = token?.amount ?? 0;
	};

	const onChangeToken = (event: Event) => {
		const address = (event.currentTarget as HTMLSelectElement).value;
		token = balances.list.find((b) => b.address === address);
		amount = 0;
	};
</script>

<div class="field-group w-full grid-cols-[auto_1fr_auto]">
	<button type="button" class="btn preset-tonal" onclick={setMax} disabled={!token}>Max</button>
	<input
		class="input"
		placeholder="Reward amount"
		bind:value={amount}
		type="number"
		step="any"
		min="0"
		max={token?.amount}
	/>
	<select
		class="select w-auto"
		value={token?.address}
		onchange={onChangeToken}
		disabled={balances.list.length === 0}
	>
		{#if !wallet.isConnected}
			<option value={undefined}>Connect wallet</option>
		{:else if balances.loading && balances.list.length === 0}
			<option value={undefined}>Loading…</option>
		{:else if balances.list.length === 0}
			<option value={undefined}>No funds</option>
		{/if}
		{#each balances.list as balance (balance.address)}
			<option value={balance.address}>{balance.symbol}</option>
		{/each}
	</select>
</div>
{#if price !== undefined}
	<div
		class="flex w-full justify-between gap-2 px-1 text-xs opacity-70"
		title="Approximate value based on {PRICE_SOURCE} prices, refreshed every few minutes"
	>
		<span>{amountEur !== undefined ? `≈ ${formatEur(amountEur)}` : ''}</span>
		{#if balanceEur !== undefined}
			<span>Balance ≈ {formatEur(balanceEur)}</span>
		{/if}
	</div>
{/if}
