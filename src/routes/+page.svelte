<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import debounce from 'just-debounce';
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { page } from '$app/stores';
	import BalanceInput from '$lib/components/Balance.svelte';
	import { createLinks } from '$lib/services/peanut';
	import { chainId, isConnected, modal, signer } from '$lib/services/wallet';
	import type { Author, Balance, CommitDetail, Email, User } from '$lib/types';

	import type { Snapshot } from './$types';

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify({ repository, contributorsNr, rewardAmount }),
		restore: (value) => {
			let data = JSON.parse(value);
			repository = data.repository;
			contributorsNr = data.contributorsNr;
			rewardAmount = data.rewardAmount;
		}
	};

	const toastStore = getToastStore();

	// export let data: PageData;
	let repository: string | null = $page.url.searchParams.get('repository');
	let contributorsNr: number = $page.url.searchParams.has('contributor')
		? parseInt($page.url.searchParams.get('contributor') ?? '0')
		: 0;
	let rewardAmount: number = $page.url.searchParams.has('reward')
		? parseFloat($page.url.searchParams.get('reward') ?? '0')
		: 0;

	let creatingLinks = false;
	let top: string[] = [];
	let selectedContributors: Author[] = [];
	let selectedToken: Balance;
	let links: { link: string; txHash: string }[] = [];
	const byLogin: Map<string, { user: User; author: Author }> = new Map();

	let greetings = ['Find', 'Reward', 'Support'];
	let index = 0;
	let rol: number;

	onMount(() => {
		topContributors();
		rol = window.setInterval(() => {
			if (index === greetings.length - 1) clearInterval(rol);
			else index++;
		}, 1250);
	});

	onDestroy(() => {
		clearInterval(rol);
	});

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

		const resp = await fetch(`/api/github?repository=${repository}&since=${since.toISOString()}`);
		if (resp.status != 200) {
			toastStore.close(toastId);
			return;
		}
		const commits = await resp.json();

		toastStore.close(toastId);

		byLogin.clear();
		let contributors: Map<string, number> = new Map();
		commits.forEach((commit: CommitDetail) => {
			byLogin.set(commit.commit.author.name, {
				author: commit.commit.author,
				user: commit.author
			});

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
			const author = byLogin.get(name)?.author;
			if (author) {
				selectedContributors = [...selectedContributors, author];
			}
		}
	}, 500);

	const createLink = async () => {
		if (!$isConnected || !$chainId) {
			await modal.open();
			return;
		}

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
			if ($signer) {
				await createLinks({
					signer: $signer,
					chainId: $chainId,
					amount: rewardAmount,
					numberOfLinks: selectedContributors.length,
					token: selectedToken
				});
			} else {
				console.log('wallet client not found');
			}
			toastStore.close(toastId);
		} catch (error) {
			toastStore.trigger({
				message: 'failed to generate rewards',
				background: 'variant-filled-warning'
			});
			console.log(error);
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
		const promises = selectedContributors.map((contributor, i) => {
			const link = links[i];
			if (!repository || !contributor || !link) {
				return;
			}
			const email: Email = {
				name: contributor.name,
				// email: contributor.email,
				email: 'christophe.dcpm@gmail.com',
				link: link.link,
				message: '',
				repoName: repository
			};

			console.log('send email:', { ...email });
			return fetch(`/api/mail`, {
				method: 'POST',
				body: JSON.stringify(email)
			});
		});
		await Promise.all(promises);
		toastStore.close(toastId);
	};
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">
			<div style="display: inline">
				<bold transition:slide>{greetings[index]}</bold> your top contributors
			</div>
		</h2>
		<form>
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim">https://github.com/</div>
				<input
					bind:value={repository}
					on:input={topContributors}
					type="text"
					id="repository"
					placeholder="owner/name"
				/>
			</div>
			<input
				bind:value={contributorsNr}
				on:input={topContributors}
				class="input my-2"
				type="number"
				step="1"
				min="1"
				placeholder="Number of contributors to reward"
			/>
			{#if top.length > 0}
				<div class="flex flex-row row mb-2">
					<BalanceInput bind:token={selectedToken} bind:amount={rewardAmount} />
				</div>
				<div class="w-full">
					<span class="font-bold">Top contributors</span>
					{#if top}
						<ul class="list">
							{#each top as login}
								{@const author = byLogin.get(login)?.author}
								{@const user = byLogin.get(login)?.user}
								<li class="flex flex-row justify-between">
									<figure class="avatar flex aspect-square overflow-hidden w-8 rounded-full">
										<img
											class="avatar-image w-full h-full object-cover"
											src={user?.avatar_url}
											alt="avatar"
										/>
									</figure>
									<span class="label mr-2">{author?.name} ({author?.email})</span>
									<span>
										<input
											bind:group={selectedContributors}
											value={user}
											class="checkbox"
											type="checkbox"
										/>
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if top.length > 0 && !links.length}
				<div class="flex flex-row justify-evenly mt-2">
					<button
						on:click={createLink}
						disabled={creatingLinks}
						class="btn variant-filled-primary w-full mr-1"
						type="submit"
					>
						{#if !$isConnected}
							Connect wallet
						{:else if !creatingLinks}
							Reward
						{:else}
							In progress ...
						{/if}
					</button>
				</div>
			{:else if links.length > 0}
				<button on:click={sendEmails} class="btn variant-filled-primary w-full" type="submit">
					Send emails
				</button>
			{/if}
		</form>
	</div>

	<div class="fixed bottom-4 right-4">
		<a href="/dashboard" class="btn variant-ghost-tertiary"> Expert mode </a>
	</div>
</div>
