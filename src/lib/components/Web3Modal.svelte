<script lang="ts">
	import { modal, wallet } from '#lib/services/wallet.svelte.ts';
	import { shortAddress } from '#lib/strings.ts';
</script>

{#if wallet.isConnected && wallet.chain}
	<button type="button" class="hidden sm:inline" onclick={() => modal.open({ view: 'Networks' })}>
		{wallet.chain.name}
	</button>
{/if}
<button type="button" class="btn preset-tonal btn-sm" onclick={() => modal.open()}>
	{#if wallet.isConnected}
		{shortAddress(wallet.address)}
	{:else}
		Connect
	{/if}
</button>
