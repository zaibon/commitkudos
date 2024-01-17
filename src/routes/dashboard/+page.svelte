<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import type { BalanceResult } from '@socket.tech/socket-v2-sdk';
	import debounce from 'just-debounce';

	import Balance from '$lib/components/Balance.svelte';
	import ContributorCard from '$lib/components/ContributorCard.svelte';
	import { loadContributors } from '$lib/pages/dashboard/lib';
	import { sendReward } from '$lib/services/reward';
	import { getAccountStores } from '$lib/services/wallet';
	import type { Contributor } from '$lib/types';

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

	const { getSigner, chainId } = getAccountStores();

	let repository: string = 'zaibon/commitkudos';
	let contributors: Contributor[] = [
		{
			login: 'zaibon',
			name: 'christophe de Carvalho',
			avatarUrl: '/android-chrome-192x192.png',
			email: 'user@mail.com',
			twitter: '',
			discord: '',
			checked: false,
			numberOfContributions: 10
		},
		{
			login: 'zaibon',
			name: 'christophe de Carvalho',
			avatarUrl: '/android-chrome-192x192.png',
			email: 'user@mail.com',
			twitter: '',
			discord: '',
			checked: false,
			numberOfContributions: 10
		},
		{
			login: 'zaibon',
			name: 'christophe de Carvalho',
			avatarUrl: '/android-chrome-192x192.png',
			email: 'user@mail.com',
			twitter: '',
			discord: '',
			checked: false,
			numberOfContributions: 10
		},
		{
			login: 'zaibon',
			name: 'christophe de Carvalho',
			avatarUrl: '/android-chrome-192x192.png',
			email: 'user@mail.com',
			twitter: '',
			discord: '',
			checked: false,
			numberOfContributions: 10
		},
		{
			login: 'zaibon',
			name: 'christophe de Carvalho',
			avatarUrl: '/android-chrome-192x192.png',
			email: 'user@mail.com',
			twitter: '',
			discord: '',
			checked: false,
			numberOfContributions: 10
		}
	];
	let selectAll: boolean = false;
	let multiReward: boolean = false;
	let selectedToken: BalanceResult;
	let rewardAmount: number | undefined;
	$: selected = contributors.filter((c) => c.checked);
	$: isAllSelected = contributors.length > 0 && contributors.every((c) => c.checked);

	function toggleSelectAll() {
		selectAll = !selectAll;
		contributors = contributors.map((c) => ({ ...c, checked: selectAll }));
	}
	async function reward() {
		if (!$chainId || !rewardAmount || !selectedToken || selected.length === 0) {
			return;
		}
		const signer = getSigner();
		if (!signer) {
			return;
		}
		await sendReward({
			signer: signer,
			chainId: $chainId,
			rewardAmount: rewardAmount,
			selectedToken: selectedToken,
			selected: selected,
			repository: repository
		});
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
			{#if selected.length > 0}
				{#if !multiReward}
					<div class="mt-3 flex flex-row justify-end gap-x-1">
						<input
							bind:value={rewardAmount}
							class="input"
							type="text"
							inputmode="numeric"
							placeholder="Amount"
						/>
						<Balance class="select h-1/2 mt-auto" bind:token={selectedToken} />
					</div>
				{/if}
				<button
					class="btn variant-filled-primary"
					on:click={reward}
					disabled={selected.length === 0}>Generate reward</button
				>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="h3 text-center underline font-small">selected contributors</h3>
			<ul>
				{#each selected as c}
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
				{#each contributors as contributor}
					<ContributorCard bind:selected={contributor.checked} {contributor} reward={multiReward} />
				{/each}
			</div>
		{/if}
	</section>
</div>
