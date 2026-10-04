<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import debounce from 'just-debounce';

	import BalanceInput from '#lib/components/Balance.svelte';
	import ContributorCard from '#lib/components/ContributorCard.svelte';
	import { loadContributors } from '#lib/contributors.ts';
	import { sendReward } from '#lib/services/reward.ts';
	import { wallet } from '#lib/services/wallet.svelte.ts';
	import { toaster } from '#lib/toaster.ts';
	import type { Balance, Contributor } from '#lib/types.ts';

	import type { Snapshot } from './$types';

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify({ repository, contributors, multiReward }),
		restore: (value) => {
			const data = JSON.parse(value);
			repository = data.repository;
			contributors = data.contributors;
			multiReward = data.multiReward;
		}
	};

	let repository = $state('');
	let contributors = $state<Contributor[]>([]);
	let creatingLinks = $state(false);

	let multiReward = $state(false);
	let singleRewardAmount = $state<{ amount: number; token?: Balance }>({ amount: 0 });

	let selectedContributors = $derived(contributors.filter((c) => c.checked));
	let isAllSelected = $derived(contributors.length > 0 && contributors.every((c) => c.checked));

	function setSelectAll(checked: boolean) {
		contributors.forEach((c) => (c.checked = checked));
	}

	async function toastedReward() {
		const toastId = toaster.create({ type: 'loading', title: 'Rewards are being created' });
		try {
			creatingLinks = true;
			const sent = await reward();
			if (sent > 0) {
				toaster.success({ title: `${sent} contributor(s) rewarded` });
			}
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to generate rewards', description: (error as Error).message });
		} finally {
			toaster.dismiss(toastId);
			creatingLinks = false;
		}
	}

	/** returns the number of rewarded contributors */
	async function reward(): Promise<number> {
		const chainId = wallet.chainId;
		const signer = wallet.signer;
		if (!chainId || !signer) {
			toaster.warning({ title: 'Connect your wallet first' });
			return 0;
		}

		const requests = multiReward
			? selectedContributors
					.filter((c) => c.reward?.token && (c.reward?.amount ?? 0) > 0)
					.map((c) => ({ amount: c.reward!.amount, token: c.reward!.token!, contributors: [c] }))
			: [
					{
						amount: singleRewardAmount.amount,
						token: singleRewardAmount.token,
						contributors: selectedContributors
					}
				];

		const valid = requests.filter(
			(r): r is { amount: number; token: Balance; contributors: Contributor[] } =>
				!!r.token && r.amount > 0 && r.contributors.length > 0
		);
		if (valid.length === 0) {
			toaster.warning({ title: 'Specify a token and a reward amount' });
			return 0;
		}

		let rewarded = 0;
		// one after the other: each request needs the user to sign transactions in the wallet
		for (const req of valid) {
			const links = await sendReward({
				signer,
				chainId,
				rewardAmount: req.amount,
				selectedToken: req.token,
				contributors: $state.snapshot(req.contributors),
				repository
			});
			rewarded += links.length;
		}
		return rewarded;
	}

	const load = debounce(async () => {
		if (repository === '') {
			contributors = [];
			return;
		}

		const resp = await loadContributors(repository);
		contributors = resp.map((c) => ({ ...c, reward: { amount: 0 } }));
	}, 300);
</script>

<div class="flex flex-col gap-4 lg:flex-row">
	<section class="w-full p-1 lg:w-1/3">
		<form class="w-full" onsubmit={(e) => e.preventDefault()}>
			<div class="field-group grid-cols-[auto_1fr]">
				<span class="label preset-tonal">https://github.com/</span>
				<input
					class="input"
					bind:value={repository}
					oninput={load}
					type="text"
					id="repository"
					placeholder="owner/name"
				/>
			</div>
		</form>
		<div class="flex flex-col gap-2">
			<div class="mt-3 flex w-fit flex-row gap-4">
				<Switch
					name="selectAll"
					checked={isAllSelected}
					onCheckedChange={(e) => setSelectAll(e.checked)}
					disabled={contributors.length === 0}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label>Select all</Switch.Label>
					<Switch.HiddenInput />
				</Switch>
				<Switch
					name="multiReward"
					checked={multiReward}
					onCheckedChange={(e) => (multiReward = e.checked)}
					disabled={contributors.length === 0}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label>Multi rewards</Switch.Label>
					<Switch.HiddenInput />
				</Switch>
			</div>
			{#if selectedContributors.length > 0}
				{#if !multiReward}
					<div class="mt-3">
						<BalanceInput
							bind:token={singleRewardAmount.token}
							bind:amount={singleRewardAmount.amount}
						/>
					</div>
				{/if}
				<button
					class="btn preset-filled-primary-500"
					onclick={toastedReward}
					disabled={selectedContributors.length === 0 || creatingLinks}
				>
					Generate reward
					{#if creatingLinks}
						<span
							class="ml-2 inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
						></span>
					{/if}
				</button>
			{/if}
		</div>
		<div class="mt-4 flex flex-col gap-2">
			<h3 class="text-center h6 underline">selected contributors</h3>
			<ul>
				{#each selectedContributors as c (c.login || c.email)}
					<li>{c.login || c.name}</li>
				{/each}
			</ul>
		</div>
	</section>
	<section class="w-full">
		{#if !repository}
			<div class="flex h-full flex-col items-center justify-center">
				<div class="text-2xl font-bold">No repository selected</div>
				<div class="text-surface-500">Specify the name of a repository to start</div>
			</div>
		{:else if contributors.length === 0}
			<div class="flex h-full flex-col items-center justify-center">
				<div class="text-2xl font-bold">No contributors found</div>
				<div class="text-surface-500">Try another repository</div>
			</div>
		{:else}
			<div class="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
				{#each contributors as contributor, i (contributor.login || contributor.email)}
					<ContributorCard bind:contributor={contributors[i]} reward={multiReward} />
				{/each}
			</div>
		{/if}
	</section>
	<div class="fixed right-4 bottom-4">
		<a href="/" class="btn preset-tonal-tertiary"> Simple mode </a>
	</div>
</div>
