<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Mail from '@lucide/svelte/icons/mail';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Users from '@lucide/svelte/icons/users';
	import Wallet from '@lucide/svelte/icons/wallet';
	import debounce from 'just-debounce';
	import { onMount } from 'svelte';

	import BalanceInput from '#lib/components/Balance.svelte';
	import ContributorRow from '#lib/components/ContributorRow.svelte';
	import RepoCard from '#lib/components/RepoCard.svelte';
	import RewardLinks from '#lib/components/RewardLinks.svelte';
	import Step, { type StepStatus } from '#lib/components/Step.svelte';
	import { loadContributors } from '#lib/contributors.ts';
	import {
		isRepositoryName,
		loadRepository,
		normalizeRepository,
		type RepoResult
	} from '#lib/repository.ts';
	import { createRewardLinks, sendRewardEmails } from '#lib/services/reward.ts';
	import { modal, wallet } from '#lib/services/wallet.svelte.ts';
	import { toaster } from '#lib/toaster.ts';
	import type { Balance, Contributor } from '#lib/types.ts';
	import { snapshot } from '$app/navigation';
	import { page } from '$app/state';

	const presets = [3, 5, 10];
	const params = page.url.searchParams;
	let repository = $state(normalizeRepository(params.get('repository') ?? ''));
	let count = $state<number | null>(parseInt(params.get('contributor') ?? '') || 5);
	let rewardAmount = $state(parseFloat(params.get('reward') ?? '') || 0);
	let selectedToken = $state<Balance>();

	snapshot({
		capture: () => ({ repository, count, rewardAmount }),
		restore: (value) => {
			({ repository, count, rewardAmount } = value);
			search();
		}
	});

	let repoState = $state<{ status: 'idle' | 'loading' } | RepoResult>({ status: 'idle' });
	let contributors = $state<Contributor[]>([]);
	// `top` is always the head of `contributors`: top[i] === contributors[i]
	// (the custom count input is empty while being edited: fall back to the default)
	let top = $derived(contributors.slice(0, count && count > 0 ? count : presets[1]));
	let selected = $derived(top.filter((c) => c.checked));
	let maxContributions = $derived(top[0]?.numberOfContributions ?? 0);

	let total = $derived((rewardAmount || 0) * selected.length);
	let insufficient = $derived(!!selectedToken && total > selectedToken.amount);

	let creatingLinks = $state(false);
	let sendingEmails = $state(false);
	let emailsSent = $state(false);
	// contributors are snapshotted when the links are created so links[i] always matches rewarded[i]
	let rewarded = $state<Contributor[]>([]);
	let links = $state<string[]>([]);
	// once the links exist the funds are deposited: lock the form so the links can't be lost
	let locked = $derived(links.length > 0);
	let privateEmails = $derived(
		rewarded.filter((c) => c.email.endsWith('@users.noreply.github.com')).length
	);

	let repoStep: StepStatus = $derived(repoState.status === 'ok' ? 'done' : 'active');
	let contributorsStep: StepStatus = $derived(
		repoState.status === 'loading'
			? 'active'
			: repoState.status !== 'ok'
				? 'pending'
				: selected.length > 0
					? 'done'
					: 'active'
	);
	let rewardStep: StepStatus = $derived(
		contributorsStep !== 'done' ? 'pending' : locked ? 'done' : 'active'
	);
	let sendStep: StepStatus = $derived(!locked ? 'pending' : emailsSent ? 'done' : 'active');

	const formatAmount = new Intl.NumberFormat('en', { maximumFractionDigits: 6 }).format;

	const greetings = ['Find', 'Reward', 'Support'];
	let index = $state(0);

	onMount(() => {
		if (repository) search();
		const interval = window.setInterval(() => {
			if (index === greetings.length - 1) clearInterval(interval);
			else index++;
		}, 1250);
		return () => clearInterval(interval);
	});

	// only the latest search may update the page
	let searchId = 0;

	async function search() {
		const id = ++searchId;
		const name = normalizeRepository(repository);
		contributors = [];
		if (!isRepositoryName(name)) {
			repoState = { status: 'idle' };
			return;
		}

		repoState = { status: 'loading' };
		const [repo, list] = await Promise.all([loadRepository(name), loadContributors(name)]);
		if (id !== searchId) return;

		repoState = repo;
		contributors = repo.status === 'ok' ? list.map((c) => ({ ...c, checked: true })) : [];
	}

	const debouncedSearch = debounce(search, 400);

	function onPaste(event: ClipboardEvent) {
		const text = event.clipboardData?.getData('text');
		if (!text) return;
		event.preventDefault();
		repository = normalizeRepository(text);
		search();
	}

	function setAllSelected(checked: boolean) {
		top.forEach((c) => (c.checked = checked));
	}

	function startOver() {
		if (
			!emailsSent &&
			!confirm(
				'The reward links have not been emailed. Make sure you copied them: they will not be shown again.'
			)
		) {
			return;
		}
		links = [];
		rewarded = [];
		emailsSent = false;
	}

	const createLink = async () => {
		if (!wallet.isConnected || !wallet.chainId) {
			await modal.open();
			return;
		}
		if (!rewardAmount || !selectedToken || selected.length === 0) {
			return;
		}
		if (!wallet.signer) {
			toaster.error({ title: 'Wallet signer not available' });
			return;
		}

		creatingLinks = true;
		try {
			const recipients = $state.snapshot(selected);
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
			creatingLinks = false;
		}
	};

	const sendEmails = async () => {
		sendingEmails = true;
		try {
			await sendRewardEmails(rewarded, links, normalizeRepository(repository));
			emailsSent = true;
			toaster.success({ title: 'Emails sent' });
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to send emails', description: (error as Error).message });
		} finally {
			sendingEmails = false;
		}
	};
</script>

<svelte:head>
	<title>CommitKudos · Reward your top open-source contributors</title>
	<meta property="og:title" content="CommitKudos" />
</svelte:head>

<div class="mx-auto w-full max-w-2xl">
	<div class="mb-10 text-center sm:-mx-16">
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
			<span class="sr-only">Reward</span>
			<span class="inline-grid justify-items-end" aria-hidden="true">
				{#each greetings as word, i (word)}
					<span
						class="col-start-1 row-start-1 bg-linear-to-r from-primary-600 to-secondary-700 bg-clip-text text-transparent transition-all duration-500 motion-reduce:transition-none dark:from-primary-400 dark:to-secondary-400 {i ===
						index
							? 'translate-y-0 opacity-100'
							: i < index
								? '-translate-y-3 opacity-0'
								: 'translate-y-3 opacity-0'}"
					>
						{word}
					</span>
				{/each}
			</span>
			your top contributors
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-lg text-balance text-surface-600-400">
			Pick a GitHub repository, choose who to thank, and send each contributor a crypto reward they
			claim with a single link.
		</p>
	</div>

	<form
		class="rounded-container border border-surface-200-800 bg-surface-50-950/70 p-5 shadow-xl backdrop-blur-sm sm:p-8"
		onsubmit={(e) => e.preventDefault()}
	>
		<Step number={1} title="Repository" hint="" status={repoStep}>
			<div class="space-y-3">
				<div class="field-group grid-cols-[auto_1fr]">
					<label for="repository" class="label preset-tonal font-mono text-sm">github.com/</label>
					<input
						class="input"
						id="repository"
						type="text"
						placeholder="owner/name"
						autocomplete="off"
						spellcheck="false"
						bind:value={repository}
						oninput={debouncedSearch}
						onpaste={onPaste}
						disabled={locked}
					/>
				</div>
				{#if repoState.status === 'loading'}
					<div
						class="flex animate-pulse items-start gap-3 rounded-container border border-surface-200-800 p-3"
						aria-label="Loading repository"
					>
						<div class="size-10 rounded-base bg-surface-200-800"></div>
						<div class="flex-1 space-y-2 py-1">
							<div class="h-3 w-1/3 rounded bg-surface-200-800"></div>
							<div class="h-3 w-2/3 rounded bg-surface-200-800"></div>
						</div>
					</div>
				{:else if repoState.status === 'ok'}
					<RepoCard repo={repoState.repo} />
				{:else if repoState.status === 'not-found'}
					<p class="flex items-center gap-1.5 text-sm text-error-600-400">
						<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
						Repository not found. Check the owner and the name.
					</p>
				{:else if repoState.status === 'error'}
					<p class="flex items-center gap-1.5 text-sm text-error-600-400">
						<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
						Could not reach GitHub: {repoState.message}
					</p>
				{/if}
			</div>
		</Step>

		<Step
			number={2}
			title="Contributors"
			hint="The most active contributors of the last 30 days will show up here."
			status={contributorsStep}
		>
			{#snippet aside()}
				<div class="flex items-center gap-1" role="group" aria-label="Number of contributors">
					<span class="mr-1 text-sm text-surface-600-400">Top</span>
					{#each presets as n (n)}
						<button
							type="button"
							class="btn tabular-nums btn-sm {count === n
								? 'preset-filled-primary-500'
								: 'preset-tonal'}"
							aria-pressed={count === n}
							disabled={locked}
							onclick={() => (count = n)}
						>
							{n}
						</button>
					{/each}
					<input
						type="number"
						class="input w-16 px-2 py-1 text-sm"
						min="1"
						max="100"
						aria-label="Custom number of contributors"
						placeholder="#"
						value={count && presets.includes(count) ? '' : count}
						oninput={(e) => (count = e.currentTarget.valueAsNumber || null)}
						disabled={locked}
					/>
				</div>
			{/snippet}

			{#if repoState.status === 'loading'}
				<ul class="space-y-1" aria-label="Loading contributors">
					{#each { length: 4 }, i (i)}
						<li class="flex animate-pulse items-center gap-3 px-2 py-2">
							<div class="w-5"></div>
							<div class="size-9 rounded-full bg-surface-200-800"></div>
							<div class="flex-1 space-y-2">
								<div class="h-3 w-1/3 rounded bg-surface-200-800"></div>
								<div class="h-2.5 w-1/4 rounded bg-surface-200-800"></div>
							</div>
						</li>
					{/each}
				</ul>
			{:else if top.length === 0}
				<div
					class="flex flex-col items-center gap-2 rounded-container border border-dashed border-surface-300-700 p-6 text-center"
				>
					<Users class="size-6 text-surface-500" aria-hidden="true" />
					<p class="font-medium">No commits in the last 30 days</p>
					<p class="text-sm text-surface-600-400">Try a more active repository.</p>
				</div>
			{:else}
				<ul class="-mx-2">
					{#each top as contributor, i (contributor.login || contributor.email)}
						<li>
							<ContributorRow
								bind:contributor={contributors[i]}
								rank={i + 1}
								max={maxContributions}
								disabled={locked}
							/>
						</li>
					{/each}
				</ul>
				<div class="mt-2 flex items-center justify-between text-sm text-surface-600-400">
					<span>{selected.length} of {top.length} selected · commits of the last 30 days</span>
					{#if !locked}
						<button
							type="button"
							class="anchor"
							onclick={() => setAllSelected(selected.length < top.length)}
						>
							{selected.length < top.length ? 'Select all' : 'Select none'}
						</button>
					{/if}
				</div>
			{/if}
		</Step>

		<Step
			number={3}
			title="Reward"
			hint="Choose the token and the amount each contributor receives."
			status={rewardStep}
		>
			<label for="amount" class="mb-1.5 block text-sm font-medium">Amount per contributor</label>
			<BalanceInput
				id="amount"
				bind:token={selectedToken}
				bind:amount={rewardAmount}
				recipients={selected.length}
				disabled={locked}
			/>

			{#if !wallet.isConnected}
				<p class="mt-3 flex items-center gap-1.5 text-sm text-surface-600-400">
					<Wallet class="size-4 shrink-0" aria-hidden="true" />
					Connect a wallet to choose the token to send.
				</p>
			{:else if selectedToken}
				<div
					class="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-base bg-surface-100-900 px-4 py-3 text-sm"
				>
					<span class="text-surface-600-400">
						{selected.length} × {formatAmount(rewardAmount || 0)}
						{selectedToken.symbol}
						{#if wallet.chain}on {wallet.chain.name}{/if}
					</span>
					<span class="font-semibold tabular-nums">
						Total {formatAmount(total)}
						{selectedToken.symbol}
					</span>
				</div>
				{#if insufficient}
					<p class="mt-2 flex items-center gap-1.5 text-sm text-warning-700-300">
						<TriangleAlert class="size-4 shrink-0" aria-hidden="true" />
						Not enough {selectedToken.symbol}: your balance is
						{formatAmount(selectedToken.amount)}.
					</p>
				{/if}
			{/if}

			{#if !locked}
				<button
					type="button"
					class="mt-4 btn w-full preset-filled-primary-500"
					onclick={createLink}
					disabled={wallet.isConnected &&
						(creatingLinks || !rewardAmount || !selectedToken || insufficient)}
				>
					{#if !wallet.isConnected}
						<Wallet class="size-4" aria-hidden="true" />
						Connect wallet
					{:else if creatingLinks}
						<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
						Confirm the transactions in your wallet…
					{:else}
						Create {selected.length} reward link{selected.length > 1 ? 's' : ''}
					{/if}
				</button>
			{/if}
		</Step>

		<Step
			number={4}
			title="Send"
			hint="Email each contributor their reward link, or share the links yourself."
			status={sendStep}
			last
		>
			<div class="space-y-4">
				<p class="text-sm text-surface-600-400">
					Your reward links are ready. Anyone holding a link can claim its reward, so only share
					each link with its contributor.
				</p>
				<RewardLinks contributors={rewarded} {links} />
				{#if privateEmails > 0}
					<p class="flex items-start gap-1.5 text-sm text-warning-700-300">
						<TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						{privateEmails} contributor{privateEmails > 1 ? 's use' : ' uses'} a private GitHub email
						and won't receive the email: copy their link and send it another way.
					</p>
				{/if}
				<div class="flex flex-col gap-2 sm:flex-row">
					<button
						type="button"
						class="btn flex-1 preset-filled-primary-500"
						onclick={sendEmails}
						disabled={sendingEmails || emailsSent}
					>
						{#if emailsSent}
							<Check class="size-4" aria-hidden="true" />
							Emails sent
						{:else if sendingEmails}
							<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
							Sending…
						{:else}
							<Mail class="size-4" aria-hidden="true" />
							Email {links.length} contributor{links.length > 1 ? 's' : ''}
						{/if}
					</button>
					<button type="button" class="btn preset-tonal" onclick={startOver}>
						<RotateCcw class="size-4" aria-hidden="true" />
						Start a new reward
					</button>
				</div>
			</div>
		</Step>
	</form>
</div>
