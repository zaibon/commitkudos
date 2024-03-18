<script lang="ts">
	import { address, chainInfo, isConnected, modal } from '$lib/services/wallet';
	import { shortAddress } from '$lib/strings';

	async function connect() {
		modal.open();
	}
</script>

<span>
	{#if $chainInfo}
		{$chainInfo?.name ?? ''}
	{/if}
</span>
<button class="btn btn-sm variant-ghost-surface" on:click={connect}>
	{#if $isConnected}
		{shortAddress($address)}
	{:else}
		Connect
	{/if}
</button>
