<script lang="ts">
	import { createLinks } from '$lib/peanutes';
	import type { CommitDetail, Author, User, Email } from '$lib/types';
	import { signer, chainId } from '$lib/wallet';
	import pkg from 'debounce';
	const { debounce } = pkg;
	import { getToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();

	let creatingLinks = false;

	let repository: string = '';
	let contributorsNr: number | undefined = undefined;
	let rewardAmount: number | undefined = undefined;
	let top: string[] = [];
	let selectedContributors: Author[] = [];
	let links: { link: string; txHash: string }[] = [];
	const byLogin: Map<string, { user: User; author: Author }> = new Map();

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
			links = await createLinks(
				$signer.signer,
				$chainId,
				rewardAmount,
				selectedContributors.length,
				0
			);
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
		const promises = selectedContributors.map((contributor, i) => {
			const link = links[i];
			if (!contributor || !link) {
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
		<h2 class="h2">Find your top contributors</h2>
		<form class="w-full">
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim">https://github.com/</div>
				<input
					bind:value={repository}
					on:change={topContributors}
					type="text"
					id="repository"
					placeholder="owner/name"
				/>
			</div>
			<input
				bind:value={contributorsNr}
				on:change={topContributors}
				class="input my-2"
				type="number"
				step="1"
				min="1"
				placeholder="Number of contributors to reward"
			/>
			{#if top.length > 0}
				<input
					bind:value={rewardAmount}
					class="input mb-2"
					type="number"
					step="any"
					min="0"
					placeholder="reward amount"
				/>
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
						{#if !creatingLinks}
							Reward
						{:else}
							In progress ...
						{/if}
					</button>
					<button class="btn variant-outline-primary w-full" disabled
						>save recurring (coming soon)</button
					>
				</div>
			{:else if links.length > 0}
				<button on:click={sendEmails} class="btn variant-filled-primary w-full" type="submit">
					Send emails
				</button>
			{/if}
		</form>
	</div>
</div>
