<script lang="ts">
	import '../app.css';

	import { AppBar, Toast } from '@skeletonlabs/skeleton-svelte';
	import { inject } from '@vercel/analytics';

	import LightSwitch from '#lib/components/LightSwitch.svelte';
	import Web3Modal from '#lib/components/Web3Modal.svelte';
	import { toaster } from '#lib/toaster.ts';
	import { dev } from '$app/env';

	let { children } = $props();

	inject({ mode: dev ? 'development' : 'production' });
</script>

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				{#if toast.description}
					<Toast.Description>{toast.description}</Toast.Description>
				{/if}
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>

<div class="grid h-full grid-rows-[auto_1fr]">
	<AppBar>
		<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
			<AppBar.Lead>
				<a href="/">
					<strong class="text-xl uppercase">CommitKudos</strong>
				</a>
			</AppBar.Lead>
			<AppBar.Headline></AppBar.Headline>
			<AppBar.Trail class="items-center">
				<Web3Modal />
				<LightSwitch />
			</AppBar.Trail>
		</AppBar.Toolbar>
	</AppBar>
	<main class="overflow-y-auto p-4">
		{@render children()}
	</main>
</div>
