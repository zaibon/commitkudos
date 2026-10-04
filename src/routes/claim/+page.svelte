<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Gift from '@lucide/svelte/icons/gift';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Wallet from '@lucide/svelte/icons/wallet';

	import { CLAIM_PATH } from '#lib/claim.ts';
	import {
		claimLink,
		getLinkDetails,
		type LinkDetails,
		parseLink,
		toClaimUrl
	} from '#lib/services/peanut.ts';
	import { modal, networks, wallet } from '#lib/services/wallet.svelte.ts';
	import { shortAddress } from '#lib/strings.ts';
	import { toaster } from '#lib/toaster.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// the link password is in the fragment, which never leaves the browser
	const link = $derived(page.url.href);
	const params = $derived(parseLink(link));
	const network = $derived(networks.find((n) => n.id === params?.chainId));

	let details = $state<LinkDetails>();
	let loadError = $state<string>();
	let claiming = $state(false);
	let txHash = $state<string>();
	let pasted = $state('');

	const onLinkChain = $derived(wallet.chainId === params?.chainId);
	const txUrl = $derived(
		txHash && network?.blockExplorers
			? `${network.blockExplorers.default.url}/tx/${txHash}`
			: undefined
	);

	$effect(() => {
		const current = link;
		details = undefined;
		loadError = undefined;
		txHash = undefined;
		if (!parseLink(current)) return;

		// ignore the answer when another link has been opened in the meantime
		let stale = false;
		getLinkDetails(current)
			.then((d) => {
				if (!stale) details = d;
			})
			.catch((error) => {
				console.error(error);
				if (!stale) loadError = (error as Error).message;
			});
		return () => (stale = true);
	});

	async function openLink(event: SubmitEvent) {
		event.preventDefault();
		const url = toClaimUrl(pasted.trim(), new URL(CLAIM_PATH, window.location.origin).href);
		if (!url) {
			toaster.warning({ title: 'This is not a valid reward link' });
			return;
		}
		pasted = '';
		await goto(url);
	}

	async function claim() {
		if (!params || !network) return;
		if (!wallet.isConnected) {
			await modal.open();
			return;
		}
		if (!onLinkChain) {
			await modal.switchNetwork(network);
			return;
		}
		if (!wallet.signer || !wallet.address) {
			toaster.error({ title: 'Wallet signer not available' });
			return;
		}

		claiming = true;
		const toastId = toaster.create({ type: 'loading', title: 'Claiming your reward' });
		try {
			txHash = await claimLink({ signer: wallet.signer, link, recipient: wallet.address });
			if (details) details = { ...details, claimed: true };
			toaster.success({ title: 'Reward claimed' });
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to claim the reward', description: (error as Error).message });
		} finally {
			toaster.dismiss(toastId);
			claiming = false;
		}
	}
</script>

<svelte:head>
	<title>CommitKudos · Claim your reward</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg">
	<div class="mb-8 text-center">
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Claim your reward</h1>
		<p class="mt-3 text-balance text-surface-600-400">
			A maintainer thanked you for your open-source contributions.
		</p>
	</div>

	<div
		class="rounded-container border border-surface-200-800 bg-surface-50-950/70 p-5 shadow-xl backdrop-blur-sm sm:p-8"
	>
		{#if !params}
			<form class="space-y-3" onsubmit={openLink}>
				<label for="link" class="block text-sm font-medium">Reward link</label>
				<input
					id="link"
					class="input font-mono text-sm"
					bind:value={pasted}
					type="text"
					placeholder="https://commitkudos.com/claim?c=…"
				/>
				<button
					class="btn w-full preset-filled-primary-500"
					type="submit"
					disabled={!pasted.trim()}
				>
					Open
				</button>
				<p class="text-sm text-surface-600-400">Links to peanut.to work too.</p>
			</form>
		{:else if !network || loadError}
			<div class="flex flex-col items-center gap-2 text-center">
				<CircleAlert class="size-6 text-error-600-400" aria-hidden="true" />
				{#if !network}
					<p class="font-medium">Unsupported network</p>
					<p class="text-sm text-surface-600-400">
						This reward was sent on a chain CommitKudos doesn't support.
					</p>
				{:else}
					<p class="font-medium">Reward not found</p>
					<p class="text-sm text-surface-600-400">
						It couldn't be read from {network.name}: {loadError}
					</p>
				{/if}
			</div>
		{:else if !details}
			<div class="flex animate-pulse flex-col items-center gap-3" aria-label="Loading your reward">
				<div class="size-12 rounded-full bg-surface-200-800"></div>
				<div class="h-7 w-1/2 rounded bg-surface-200-800"></div>
				<div class="h-3 w-2/3 rounded bg-surface-200-800"></div>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 text-center">
				<div class="flex size-12 items-center justify-center rounded-full preset-tonal-primary">
					<Gift class="size-6" aria-hidden="true" />
				</div>
				<p class="text-3xl font-bold tabular-nums">{details.tokenAmount} {details.tokenSymbol}</p>
				<p class="text-sm text-surface-600-400">
					on {network.name}, sent by
					<span class="font-mono">{shortAddress(details.senderAddress)}</span>
					on {details.depositDate.toLocaleDateString()}
				</p>
			</div>

			<div class="mt-6">
				{#if txHash}
					<p class="flex items-center justify-center gap-1.5 text-success-700-300">
						<Check class="size-4 shrink-0" aria-hidden="true" />
						Claimed to <span class="font-mono">{shortAddress(wallet.address)}</span>
					</p>
					{#if txUrl}
						<a class="mt-2 btn w-full preset-tonal" href={txUrl} target="_blank" rel="noreferrer">
							<ExternalLink class="size-4" aria-hidden="true" />
							See the transaction
						</a>
					{/if}
				{:else if details.claimed}
					<p class="flex items-center justify-center gap-1.5 text-surface-600-400">
						<Check class="size-4 shrink-0" aria-hidden="true" />
						This reward has already been claimed.
					</p>
				{:else}
					<button
						class="btn w-full preset-filled-primary-500"
						onclick={claim}
						disabled={claiming}
						type="button"
					>
						{#if !wallet.isConnected}
							<Wallet class="size-4" aria-hidden="true" />
							Connect wallet to claim
						{:else if !onLinkChain}
							Switch to {network.name}
						{:else if claiming}
							<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
							Confirm the transaction in your wallet…
						{:else}
							Claim to {shortAddress(wallet.address)}
						{/if}
					</button>
					<p class="mt-2 text-center text-sm text-surface-600-400">
						Claiming is an on-chain transaction: you need a little {network.nativeCurrency.symbol}
						on {network.name} to pay for gas.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
