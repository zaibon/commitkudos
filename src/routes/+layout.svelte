<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';

	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { inject } from '@vercel/analytics';

	import CurrencySwitch from '#lib/components/CurrencySwitch.svelte';
	import LightSwitch from '#lib/components/LightSwitch.svelte';
	import Web3Modal from '#lib/components/Web3Modal.svelte';
	import logo from '#lib/logo-mark.png';
	import { toaster } from '#lib/toaster.ts';
	import { dev } from '$app/env';
	import { page } from '$app/state';

	let { children } = $props();

	inject({ mode: dev ? 'development' : 'production' });

	const nav = [
		{ href: '/', label: 'Reward' },
		{ href: '/dashboard', label: 'Advanced' },
		{ href: '/badges', label: 'Badge' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	const description =
		'Reward the top contributors of any GitHub repository with crypto, in a few clicks.';
</script>

<svelte:head>
	<meta name="description" content={description} />
	<meta property="og:site_name" content="CommitKudos" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="https://commitkudos.com/og-image.png" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

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

<div class="flex min-h-full flex-col">
	<header
		class="sticky top-0 z-10 border-b border-surface-200-800 bg-surface-50-950/75 backdrop-blur-md"
	>
		<div class="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:gap-x-8">
			<a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="CommitKudos home">
				<img src={logo} alt="" width="36" height="36" class="size-9 rounded-lg shadow-sm" />
				<span class="text-lg font-bold tracking-tight">
					Commit<span class="text-secondary-700 dark:text-secondary-400">Kudos</span>
				</span>
			</a>
			<nav
				class="order-last -mx-1 flex w-full items-center gap-1 md:order-none md:mx-0 md:w-auto"
				aria-label="Main"
			>
				{#each nav as item (item.href)}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="rounded-base px-3 py-1.5 text-sm font-medium transition-colors {active
							? 'preset-tonal-primary'
							: 'text-surface-600-400 hover:bg-surface-200-800 hover:text-surface-950-50'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-2">
				<Web3Modal />
				<CurrencySwitch />
				<LightSwitch />
			</div>
		</div>
	</header>

	<main class="container mx-auto flex flex-1 flex-col px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-surface-200-800">
		<div
			class="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-surface-600-400 sm:flex-row"
		>
			<p>
				Built on <a class="anchor" href="https://peanut.to" target="_blank" rel="noreferrer"
					>Peanut Protocol</a
				>. Open source under the MIT license.
			</p>
			<a
				href="https://github.com/zaibon/commitkudos"
				target="_blank"
				rel="noreferrer"
				class="flex items-center gap-1.5 transition-colors hover:text-surface-950-50"
			>
				<svg viewBox="0 0 24 24" class="size-4 fill-current" aria-hidden="true">
					<path
						d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"
					/>
				</svg>
				GitHub
			</a>
		</div>
	</footer>
</div>
