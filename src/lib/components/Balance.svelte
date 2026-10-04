<script lang="ts">
	import { untrack } from 'svelte';

	import { balances } from '#lib/services/balances.svelte.ts';
	import { formatPrice, PRICE_SOURCE, prices } from '#lib/services/prices.svelte.ts';
	import { wallet } from '#lib/services/wallet.svelte.ts';
	import type { Balance } from '#lib/types.ts';

	let {
		token = $bindable(),
		amount = $bindable(0),
		id,
		disabled = false,
		recipients = 1
	}: {
		token?: Balance;
		amount?: number;
		/** id of the amount input, to attach a <label> */
		id?: string;
		disabled?: boolean;
		/** the amount is sent to each recipient: "Max" splits the balance between them */
		recipients?: number;
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

	const price = $derived(prices.price(token));
	const amountValue = $derived(price !== undefined && amount > 0 ? amount * price : undefined);
	const balanceValue = $derived(price !== undefined && token ? token.amount * price : undefined);
	const format = (value: number) => formatPrice(value, prices.currency);
	const formatToken = new Intl.NumberFormat('en', { maximumFractionDigits: 6 }).format;

	const setMax = () => {
		// round down so the total never exceeds the balance
		const precision = 10 ** Math.min(token?.decimals ?? 6, 6);
		amount = Math.floor(((token?.amount ?? 0) / Math.max(recipients, 1)) * precision) / precision;
	};

	const onChangeToken = (event: Event) => {
		const address = (event.currentTarget as HTMLSelectElement).value;
		token = balances.list.find((b) => b.address === address);
		amount = 0;
	};
</script>

<div class="field-group w-full grid-cols-[1fr_auto_auto]">
	<input
		{id}
		aria-label={id ? undefined : 'Reward amount'}
		class="input"
		placeholder="0.00"
		bind:value={amount}
		type="number"
		inputmode="decimal"
		step="any"
		min="0"
		max={token ? token.amount / Math.max(recipients, 1) : undefined}
		{disabled}
	/>
	<button
		type="button"
		class="btn preset-tonal text-xs font-semibold uppercase"
		onclick={setMax}
		disabled={disabled || !token}
	>
		Max
	</button>
	<select
		class="select w-auto"
		value={token?.address}
		onchange={onChangeToken}
		aria-label="Token"
		disabled={disabled || balances.list.length === 0}
	>
		{#if !wallet.isConnected}
			<option value={undefined}>Token</option>
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
{#if token}
	<div
		class="mt-1 flex w-full justify-between gap-2 text-xs text-surface-600-400"
		title={price !== undefined
			? `Approximate value based on ${PRICE_SOURCE} prices, refreshed every few minutes`
			: undefined}
	>
		<span class="tabular-nums">{amountValue !== undefined ? `≈ ${format(amountValue)}` : ''}</span>
		<span>
			Balance: <span class="tabular-nums">{formatToken(token.amount)}</span>
			{token.symbol}
			{#if balanceValue !== undefined}
				<span class="tabular-nums">(≈ {format(balanceValue)})</span>
			{/if}
		</span>
	</div>
{/if}
