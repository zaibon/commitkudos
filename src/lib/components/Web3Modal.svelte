<script lang="ts">
	import { modal, wallet } from '#lib/services/wallet.svelte.ts';
	import { shortAddress } from '#lib/strings.ts';
</script>

{#if wallet.isConnected && wallet.chain}
	<button
		type="button"
		class="btn hidden preset-outlined-surface-200-800 btn-sm sm:inline-flex"
		title="Switch network"
		onclick={() => modal.open({ view: 'Networks' })}
	>
		<span class="size-2 rounded-full bg-success-500" aria-hidden="true"></span>
		{wallet.chain.name}
	</button>
{/if}
{#if wallet.isConnected}
	<button type="button" class="btn preset-tonal font-mono btn-sm" onclick={() => modal.open()}>
		{shortAddress(wallet.address)}
	</button>
{:else}
	<button type="button" class="btn preset-filled-primary-500 btn-sm" onclick={() => modal.open()}>
		<span class="sm:hidden">Connect</span>
		<span class="hidden sm:inline">Connect wallet</span>
	</button>
{/if}
