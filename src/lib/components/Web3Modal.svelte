<script lang="ts">
	import { CHAIN_DETAILS } from '@squirrel-labs/peanut-sdk';

	import { shortAddress } from '$lib/strings';
	import { getAccountStores, open } from '$lib/wallet';

	const { isConnected, address, chainId } = getAccountStores();
	$: network = CHAIN_DETAILS[$chainId];

	async function connect() {
		open();
	}
</script>

<span>
	{network?.name ?? ''}
</span>
<button class="btn btn-sm variant-ghost-surface" on:click={connect}>
	{#if $isConnected}
		{shortAddress($address)}
	{:else}
		Connect
	{/if}
</button>
