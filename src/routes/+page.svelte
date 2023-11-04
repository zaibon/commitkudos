<script lang="ts">
	import { createLinks } from '$lib/peanutes';
	import type { CommitDetail, User } from '$lib/types';
	import { signer, chainId } from '$lib/wallet';
	import { debounce } from 'debounce';
	import { onMount } from 'svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();

	let repository: string = 'kataras/iris';
	let contributorsNr = 3;
	let rewardAmount = 0;
	let top: string[] = [];
	let creatingLinks = false;

	const topContributors = debounce(async () => {
		const since = new Date();
		since.setDate(since.getDate() - 7);

		if (!repository || contributorsNr <= 0) {
			return;
		}
		let [owner, name] = repository.split('/', 2);
		if (!owner || !name) {
			return;
		}

		const resp = await fetch(`/?repository=${repository}&since=${since.toISOString()}`);
		if (resp.status != 200) {
			return;
		}
		const commits = await resp.json();

		const byLogin: Map<string, User> = new Map();
		let contributors: Map<string, number> = new Map();
		commits.forEach((commit: CommitDetail) => {
			byLogin.set(commit.author.login, commit.author);

			const nr = contributors.get(commit.author.login);
			if (!nr) {
				contributors.set(commit.author.login, 1);
			} else {
				contributors.set(commit.author.login, nr + 1);
			}
		});
		const byContributions = new Map([...contributors.entries()].sort((a, b) => b[1] - a[1]));
		let tmp = [...byContributions.keys()].slice(0, contributorsNr);
		top = tmp;
	}, 500);

	const createLink = async () => {
		if (rewardAmount <= 0) {
			return;
		}
		creatingLinks = true;
		try {
			const links = await createLinks($signer.signer, $chainId, 0.0001, 2, 0);
			console.log(links);
		} catch (error) {
			console.log(error);
			toastStore.trigger({
				message: 'failed to generate rewards',
				background: 'variant-filled-warning'
			});
		} finally {
			creatingLinks = false;
		}
	};
	onMount(topContributors);
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">Find me name</h2>
		<form class="w-3/5">
			<input
				bind:value={repository}
				on:change={topContributors}
				class="input"
				type="text"
				id="repository"
				placeholder="repository name"
			/>
			<input
				bind:value={contributorsNr}
				on:change={topContributors}
				class="input my-2"
				type="number"
				step="1"
				min="1"
				placeholder="number of contributrs"
			/>
			{#if top.length > 0}
				<input
					bind:value={rewardAmount}
					class="input mb-2"
					type="number"
					step="0.001"
					min="0"
					placeholder="reward amount"
				/>
				<span class="font-bold">Top contributors</span>
				{#each top as user}
					<div class="flex flex-row justify-between mb-2">
						<p class="label mr-2">{user}</p>
					</div>
				{/each}
			{/if}

			{#if top.length > 0}
				<button
					on:click={createLink}
					disabled={creatingLinks}
					class="btn variant-filled-primary w-full"
					type="submit"
				>
					{#if !creatingLinks}
						Reward
					{:else}
						In progress ...
					{/if}
				</button>
			{/if}
		</form>
	</div>
</div>
