<script lang="ts">
	import { useWeb3Modal, useWeb3ModalAccount } from '$lib/wallet';

	const { open } = useWeb3Modal();
	const { isConnected, address } = useWeb3ModalAccount();

	async function connect() {
		if ($isConnected) {
			open();
		} else {
			open({ view: 'Networks' });
		}
	}
</script>

<button class="btn btn-sm variant-ghost-surface" on:click={connect}>
	{#if $isConnected}
		{$address}
	{:else}
		Connect
	{/if}
</button>
