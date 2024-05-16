<script lang="ts">
	import { getToastStore, ProgressRadial, SlideToggle } from '@skeletonlabs/skeleton';
	import debounce from 'just-debounce';

	import BalanceInput from '$lib/components/Balance.svelte';
	import ContributorCard from '$lib/components/ContributorCard.svelte';
	import { loadContributors } from '$lib/pages/dashboard/lib';
	import { sendReward } from '$lib/services/reward';
	import { chainId, signer } from '$lib/services/wallet';
	import type { Balance, Contributor, RewardAmount } from '$lib/types';

	import type { Snapshot } from './$types';

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify({ repository, contributors, selectAll, multiReward }),
		restore: (value) => {
			let data = JSON.parse(value);
			repository = data.repository;
			contributors = data.contributors;
			selectAll = data.selectAll;
			multiReward = data.multiReward;
		}
	};

	const toastStore = getToastStore();

	let repository: string = '';
	let contributors: Contributor[] = [];
	let creatingLinks: boolean = false;

	let selectAll: boolean = false;
	let multiReward: boolean = false;
	let multiRewardAmounts: RewardAmount[] = [];
	let singleRewardAmount: { amount: number; token: Balance } = {
		amount: 0,
		token: {} as Balance
	};
	$: selectedContributors = contributors.filter((c) => c.checked);
	$: isAllSelected = contributors.length > 0 && contributors.every((c) => c.checked);

	function toggleSelectAll() {
		selectAll = !selectAll;
		contributors = contributors.map((c) => ({ ...c, checked: selectAll }));
	}

	async function toastedReward() {
		const toastId = toastStore.trigger({
			message: 'Rewards are being created',
			background: 'variant-filled-primary',
			autohide: false
		});
		try {
			creatingLinks = true;
			await reward();
		} catch (error) {
			console.log(error);
			toastStore.trigger({
				message: 'Failed to generate rewards',
				background: 'variant-filled-warning'
			});
		} finally {
			toastStore.close(toastId);
			creatingLinks = false;
		}
	}

	async function reward() {
		if (multiReward) {
			const linkCreateReq = multiRewardAmounts
				.filter((r) => r.amount > 0 && r.contributor)
				.map((r) => {
					return {
						amount: r.amount,
						token: r.token,
						contributors: [r.contributor]
					};
				});
			await Promise.all(
				linkCreateReq.map(async (req) => {
					return await singleReward($chainId, req.amount, req.token, req.contributors, repository);
				})
			);
		} else {
			await singleReward(
				$chainId,
				singleRewardAmount.amount,
				singleRewardAmount.token,
				selectedContributors,
				repository
			);
		}
	}

	async function singleReward(
		chainId: number | undefined,
		rewardAmount: number,
		token: Balance,
		contributors: Contributor[],
		repository: string
	) {
		if (!chainId || !rewardAmount || !token || selectedContributors.length === 0) {
			return;
		}

		if (!$signer) {
			return;
		}
		const links = await sendReward({
			signer: $signer,
			chainId: chainId,
			rewardAmount: rewardAmount,
			selectedToken: token,
			contributors: contributors,
			repository: repository
		});
		console.log('links', links);
	}

	const load = debounce(async () => {
		if (repository === '') {
			contributors = [];
			return;
		}

		let resp = await loadContributors(repository);
		if (resp && resp.length > 0) {
			contributors = resp;
		}
	}, 200);
</script>

<div class="flex lg:flex-row flex-col">
	<section class="w-full lg:w-1/3 p-1">
		<form class="w-full">
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim">https://github.com/</div>
				<input
					bind:value={repository}
					on:input={load}
					type="text"
					id="repository"
					placeholder="owner/name"
				/>
			</div>
		</form>
		<div class="flex flex-col gap-2 min-height-[500px]">
			<div class="flex flex-row w-fit mt-2 gap-2">
				<SlideToggle
					name="selectAll"
					on:change={toggleSelectAll}
					bind:checked={isAllSelected}
					disabled={contributors.length === 0}
				>
					Select all
				</SlideToggle>
				<SlideToggle
					name="multiReward"
					bind:checked={multiReward}
					disabled={contributors.length === 0}>Multi rewards</SlideToggle
				>
			</div>
			{#if selectedContributors.length > 0}
				{#if !multiReward}
					<div class="mt-3 flex flex-row justify-end gap-x-1">
						<BalanceInput
							bind:token={singleRewardAmount.token}
							bind:amount={singleRewardAmount.amount}
						/>
					</div>
				{/if}
				<button
					class="btn variant-filled-primary"
					on:click={toastedReward}
					disabled={selectedContributors.length === 0 || creatingLinks}
				>
					Generate reward
					{#if creatingLinks}
						<ProgressRadial class="w-8 pl-2" />
					{/if}
				</button>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="h3 text-center underline font-small">selected contributors</h3>
			<ul>
				{#each selectedContributors as c}
					<li>{c.login}</li>
				{/each}
			</ul>
		</div>
	</section>
	<section class="w-full">
		{#if !repository}
			<div class="flex flex-col items-center justify-center h-full">
				<div class="text-2xl font-bold">No repository selected</div>
				<div class="text-gray-500">Specify the name of a repository to start</div>
			</div>
		{:else if repository && contributors.length === 0}
			<div class="flex flex-col items-center justify-center h-full">
				<div class="text-2xl font-bold">No contributors found</div>
				<div class="text-gray-500">Try another repository</div>
			</div>
		{:else}
			<div class="grid md:grid-cols-1 lg:grid-cols-2 gap-3">
				{#each contributors as contributor, i}
					<ContributorCard
						bind:selected={contributor.checked}
						{contributor}
						reward={multiReward}
						bind:rewardAmount={multiRewardAmounts[i]}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>
