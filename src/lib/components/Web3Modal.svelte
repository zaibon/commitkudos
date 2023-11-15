<script lang="ts">
	import { chains } from '$lib/consts/chains';
	import { getAccountStores, open } from '$lib/services/wallet';
	import { shortAddress } from '$lib/strings';

	const { isConnected, address, chainId } = getAccountStores();
	$: network = chains.find((c) => $chainId == c.id);

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
