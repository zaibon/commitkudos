<script lang="ts">
	import type { CommitDetail, User } from '$lib/types';
	import { debounce } from 'debounce';
	import { onMount } from 'svelte';

	let repository: string = 'kataras/iris';
	let contributorsNr = 3;
	let top: string[] = [];

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
		// take top x
		let tmp = [...byContributions.keys()].slice(0, contributorsNr);
		top = tmp;
		console.log(top);
	}, 500);

	onMount(topContributors);
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">Find me name</h2>
		<form>
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
			{#each top as user}
				<div class="flex flex-row justify-between mb-2">
					<label class="label mr-2" for={user}>{user}</label>
					<input class="input w-24" type="number" step="any" min="0" placeholder="reward amount" />
				</div>
			{/each}

			{#if top.length > 0}
				<button class="btn variant-filled-primary w-full" type="submit">Reward</button>
			{/if}
		</form>
	</div>
</div>
