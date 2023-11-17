<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import pkg from 'debounce';

	import ContributorCard from '$lib/components/ContributorCard.svelte';
	import { loadContributors } from '$lib/pages/dasboard/lib';
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

	const { debounce } = pkg;

	let repository: string = '';
	let contributors: Contributor[] = [];
	let selectAll: boolean = false;
	let multiReward: boolean = false;
	$: selected = contributors.filter((c) => c.checked);

	function toggleSelectAll() {
		selectAll = !selectAll;
		contributors = contributors.map((c) => ({ ...c, checked: selectAll }));
	}
	function reward() {}
	const load = debounce(async () => {
		let resp = await loadContributors(repository);
		if (resp && resp.length > 0) {
			contributors = resp;
		}
	}, 200);
</script>

<div class="flex lg:flex-row flex-col">
	<section class="w-full lg:w-1/3">
		<h1>Search</h1>

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
		<div class="flex flex-col w-fit mt-2 gap-2">
			<button class="btn variant-filled" on:click={toggleSelectAll}>
				{#if selectAll}
					Unselect all
				{:else}
					Select all
				{/if}
			</button>
			<SlideToggle name="multiReward" bind:checked={multiReward}>Multi rewards</SlideToggle>
			{#if selected.length > 0}
				<button class="btn variant-filled-primary" on:click={reward}>Generate reward</button>
			{/if}
		</div>
	</section>
	<section class="w-full">
		<h1>Contributors</h1>
		<div class="grid md:grid-cols-1 lg:grid-cols-2 gap-3">
			{#each contributors as contributor}
				<ContributorCard bind:selected={contributor.checked} {contributor} reward={multiReward} />
			{/each}
		</div>
	</section>
</div>
