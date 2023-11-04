<script lang="ts">
	import { createLinks } from '$lib/peanutes';
	import type { CommitDetail, Author } from '$lib/types';
	import { signer, chainId } from '$lib/wallet';
	import { debounce } from 'debounce';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { sendMail } from '$lib/mail';

	const toastStore = getToastStore();

	let creatingLinks = false;

	let repository: string = '';
	let contributorsNr: number | undefined = undefined;
	let rewardAmount: number | undefined = undefined;
	let top: string[] = [];
	let selectedContributors: Author[] = [];
	let links: { link: string; txHash: string }[] = [];
	const byLogin: Map<string, Author> = new Map();

	const topContributors = debounce(async () => {
		selectedContributors = [];
		top = [];

		const since = new Date();
		since.setDate(since.getDate() - 30);

		if (!repository || !contributorsNr) {
			return;
		}
		let [owner, name] = repository.split('/', 2);
		if (!owner || !name) {
			return;
		}

		const toastId = toastStore.trigger({
			message: 'Searching top contributors'
		});

		const resp = await fetch(`/?repository=${repository}&since=${since.toISOString()}`);
		if (resp.status != 200) {
			toastStore.close(toastId);
			return;
		}
		const commits = await resp.json();

		toastStore.close(toastId);

		byLogin.clear();
		let contributors: Map<string, number> = new Map();
		commits.forEach((commit: CommitDetail) => {
			byLogin.set(commit.commit.author.name, commit.commit.author);

			const nr = contributors.get(commit.commit.author.name);
			if (!nr) {
				contributors.set(commit.commit.author.name, 1);
			} else {
				contributors.set(commit.commit.author.name, nr + 1);
			}
		});
		const byContributions = new Map([...contributors.entries()].sort((a, b) => b[1] - a[1]));
		let tmp = [...byContributions.keys()].slice(0, contributorsNr);
		top = tmp;
		for (let i = 0; i < top.length; i++) {
			const name = top[i];
			const author = byLogin.get(name);
			if (author) {
				selectedContributors = [...selectedContributors, author];
			}
		}
	}, 500);

	const createLink = async () => {
		if (!rewardAmount) {
			toastStore.trigger({
				message: 'Specifiy a reward amount before generating the links',
				background: 'variant-filled-warning',
				timeout: 2000
			});
			return;
		}
		creatingLinks = true;
		const toastId = toastStore.trigger({
			message: 'Rewards are being created',
			background: 'variant-filled-primary',
			autohide: false
		});
		try {
			links = await createLinks($signer.signer, $chainId, 0.0001, selectedContributors.length, 0);
			console.log(links);
			toastStore.close(toastId);
		} catch (error) {
			console.log(error);
			toastStore.trigger({
				message: 'failed to generate rewards',
				background: 'variant-filled-warning'
			});
		} finally {
			toastStore.close(toastId);
			creatingLinks = false;
		}
	};

	const sendEmails = async () => {
		const toastId = toastStore.trigger({
			message: 'Sending emails',
			background: 'variant-filled-primary',
			autohide: false
		});
		for (let i = 0; i < selectedContributors.length; i++) {
			const link = links[i];
			const user = selectedContributors[i];
			if (!user) {
				return;
			}
			console.log(user.name, user.email, repository, link.link);
			sendMail(user.name, user.email, repository, link);
		}
		toastStore.close(toastId);
	};
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
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<input
						bind:value={rewardAmount}
						class="input mb-2"
						type="number"
						step="any"
						min="0"
						placeholder="reward amount"
					/>
				</div>
				<span class="font-bold">Top contributors</span>
				{#each top as login}
					{@const user = byLogin.get(login)}
					<div class="flex flex-row justify-between mb-2">
						<p class="label mr-2">{user?.name} ({user?.email})</p>
						<input
							bind:group={selectedContributors}
							value={user}
							class="checkbox"
							type="checkbox"
						/>
					</div>
				{/each}
			{/if}

			{#if top.length > 0 && !links.length}
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
			{:else if links.length > 0}
				<button on:click={sendEmails} class="btn variant-filled-primary w-full" type="submit">
					Send emails
				</button>
			{/if}
		</form>
		<div>
			{#each links as link}
				<p>{link.link}</p>
			{/each}
		</div>
	</div>
</div>
