<script lang="ts">
	import { shortenWalletAddress } from '$lib/strings';
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
	$: addr = shortenWalletAddress($address ?? '');
</script>

<button class="btn btn-sm variant-ghost-surface" on:click={connect}>
	{#if $isConnected}
		{addr}
	{:else}
		Connect
	{/if}
</button>
