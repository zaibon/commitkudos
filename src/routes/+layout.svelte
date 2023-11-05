<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { initializeStores } from '@skeletonlabs/skeleton';
	import { initStores, openWalletModal, address, isConnected } from '$lib/wallet';
	import { Toast } from '@skeletonlabs/skeleton';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	inject({ mode: dev ? 'development' : 'production' });

	initializeStores();

	onMount(() => {
		initStores();
	});

	function connect() {
		if ($isConnected) {
			openWalletModal({});
		} else {
			openWalletModal({ view: 'Networks' });
		}
	}

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	import logo from '$lib/logo.png';
</script>

<Toast position="tr" />

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">CommitKudos</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<button class="btn btn-sm variant-ghost-surface" on:click={connect}>
					{#if $isConnected}
						{$address}
					{:else}
						Connect
					{/if}
				</button>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
