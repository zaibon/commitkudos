<script lang="ts">
	import debounce from 'just-debounce';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import BalanceInput from '#lib/components/Balance.svelte';
	import { loadContributors } from '#lib/contributors.ts';
	import { createRewardLinks, sendRewardEmails } from '#lib/services/reward.ts';
	import { modal, wallet } from '#lib/services/wallet.svelte.ts';
	import { toaster } from '#lib/toaster.ts';
	import type { Balance, Contributor } from '#lib/types.ts';
	import { page } from '$app/state';

	import type { Snapshot } from './$types';

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify({ repository, contributorsNr, rewardAmount }),
		restore: (value) => {
			const data = JSON.parse(value);
			repository = data.repository;
			contributorsNr = data.contributorsNr;
			rewardAmount = data.rewardAmount;
			topContributors();
		}
	};

	const params = page.url.searchParams;
	let repository = $state(params.get('repository') ?? '');
	let contributorsNr = $state(parseInt(params.get('contributor') ?? '') || undefined);
	let rewardAmount = $state(parseFloat(params.get('reward') ?? '') || 0);

	let selectedToken = $state<Balance>();
	let top = $state<Contributor[]>([]);
	let selectedContributors = $derived(top.filter((c) => c.checked));

	let creatingLinks = $state(false);
	let sendingEmails = $state(false);
	let emailsSent = $state(false);
	// contributors are snapshotted when the links are created so links[i] always matches rewarded[i]
	let rewarded = $state<Contributor[]>([]);
	let links = $state<string[]>([]);

	const greetings = ['Find', 'Reward', 'Support'];
	let index = $state(0);

	onMount(() => {
		topContributors();
		const interval = window.setInterval(() => {
			if (index === greetings.length - 1) clearInterval(interval);
			else index++;
		}, 1250);
		return () => clearInterval(interval);
	});

	function resetRewards() {
		links = [];
		rewarded = [];
		emailsSent = false;
	}

	const topContributors = debounce(async () => {
		top = [];
		resetRewards();

		if (!repository || !contributorsNr) {
			return;
		}
		const [owner, name] = repository.split('/', 2);
		if (!owner || !name) {
			return;
		}

		const toastId = toaster.create({ type: 'loading', title: 'Searching top contributors' });
		try {
			const contributors = await loadContributors(repository);
			top = contributors.slice(0, contributorsNr).map((c) => ({ ...c, checked: true }));
			if (top.length === 0) {
				toaster.warning({ title: `No contributions found for ${repository} in the last 30 days` });
			}
		} finally {
			toaster.dismiss(toastId);
		}
	}, 500);

	const createLink = async () => {
		if (!wallet.isConnected || !wallet.chainId) {
			await modal.open();
			return;
		}
		if (!rewardAmount) {
			toaster.warning({
				title: 'Specify a reward amount before generating the links',
				duration: 2000
			});
			return;
		}
		if (!selectedToken) {
			toaster.warning({ title: 'Select a token to reward with', duration: 2000 });
			return;
		}
		if (selectedContributors.length === 0) {
			toaster.warning({ title: 'Select at least one contributor', duration: 2000 });
			return;
		}
		if (!wallet.signer) {
			toaster.error({ title: 'Wallet signer not available' });
			return;
		}

		creatingLinks = true;
		const toastId = toaster.create({ type: 'loading', title: 'Rewards are being created' });
		try {
			const recipients = $state.snapshot(selectedContributors);
			links = await createRewardLinks({
				signer: wallet.signer,
				chainId: wallet.chainId,
				rewardAmount,
				selectedToken,
				contributors: recipients
			});
			rewarded = recipients;
			toaster.success({ title: `${links.length} reward link(s) created` });
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to generate rewards', description: (error as Error).message });
		} finally {
			toaster.dismiss(toastId);
			creatingLinks = false;
		}
	};

	const sendEmails = async () => {
		sendingEmails = true;
		const toastId = toaster.create({ type: 'loading', title: 'Sending emails' });
		try {
			await sendRewardEmails(rewarded, links, repository);
			emailsSent = true;
			toaster.success({ title: 'Emails sent' });
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to send emails', description: (error as Error).message });
		} finally {
			toaster.dismiss(toastId);
			sendingEmails = false;
		}
	};
</script>

<div class="container mx-auto flex h-full items-center justify-center">
	<div class="flex w-full max-w-xl flex-col items-center space-y-10 text-center">
		<h2 class="h2">
			{#key index}
				<b class="inline-block" in:slide>{greetings[index]}</b>
			{/key}
			your top contributors
		</h2>
		<form class="w-full space-y-2" onsubmit={(e) => e.preventDefault()}>
			<div class="field-group grid-cols-[auto_1fr]">
				<span class="label preset-tonal">https://github.com/</span>
				<input
					class="input"
					bind:value={repository}
					oninput={topContributors}
					type="text"
					id="repository"
					placeholder="owner/name"
				/>
			</div>
			<input
				bind:value={contributorsNr}
				oninput={topContributors}
				class="input"
				type="number"
				step="1"
				min="1"
				placeholder="Number of contributors to reward"
			/>
			{#if top.length > 0}
				<BalanceInput bind:token={selectedToken} bind:amount={rewardAmount} />
				<div class="w-full">
					<span class="font-bold">Top contributors</span>
					<ul class="space-y-2">
						{#each top as contributor (contributor.login || contributor.email)}
							<li class="flex flex-row items-center justify-between gap-2">
								<figure class="flex aspect-square w-8 shrink-0 overflow-hidden rounded-full">
									{#if contributor.avatarUrl}
										<img
											class="h-full w-full object-cover"
											src={contributor.avatarUrl}
											alt="avatar"
										/>
									{/if}
								</figure>
								<span class="mr-2 flex-1 truncate text-left"
									>{contributor.name} ({contributor.email})</span
								>
								<input
									bind:checked={contributor.checked}
									class="checkbox"
									type="checkbox"
									disabled={links.length > 0}
								/>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if top.length > 0 && !links.length}
				<button
					onclick={createLink}
					disabled={creatingLinks}
					class="mt-2 btn w-full preset-filled-primary-500"
					type="submit"
				>
					{#if !wallet.isConnected}
						Connect wallet
					{:else if !creatingLinks}
						Reward
					{:else}
						In progress ...
					{/if}
				</button>
			{:else if links.length > 0}
				<button
					onclick={sendEmails}
					disabled={sendingEmails || emailsSent}
					class="mt-2 btn w-full preset-filled-primary-500"
					type="submit"
				>
					{#if emailsSent}
						Emails sent
					{:else if sendingEmails}
						Sending ...
					{:else}
						Send emails
					{/if}
				</button>
				<details class="text-left">
					<summary class="cursor-pointer">Reward links</summary>
					<ul class="mt-2 space-y-1 text-sm break-all">
						{#each links as link, i (link)}
							<li><span class="font-semibold">{rewarded[i]?.name}</span>: {link}</li>
						{/each}
					</ul>
				</details>
			{/if}
		</form>
	</div>

	<div class="fixed right-4 bottom-4">
		<a href="/dashboard" class="btn preset-tonal-tertiary"> Expert mode </a>
	</div>
</div>
