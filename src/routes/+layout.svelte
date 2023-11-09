<script lang="ts">
	import '../app.postcss';

	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { AppBar, AppShell, initializeStores, storePopup, Toast } from '@skeletonlabs/skeleton';
	import { inject } from '@vercel/analytics';

	import { dev } from '$app/environment';
	import Web3Modal from '$lib/components/Web3Modal.svelte';
	import { initWeb3Modal } from '$lib/wallet';

	// sentry
	inject({ mode: dev ? 'development' : 'production' });

	initializeStores();
	initWeb3Modal();

	// Floating UI for Popups
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Toast position="tr" />

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<a href="/">
					<strong class="text-xl uppercase">CommitKudos</strong>
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<Web3Modal />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
