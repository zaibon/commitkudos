<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Search from '@lucide/svelte/icons/search';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Users from '@lucide/svelte/icons/users';
	import Wallet from '@lucide/svelte/icons/wallet';
	import debounce from 'just-debounce';
	import { onMount } from 'svelte';

	import BalanceInput from '#lib/components/Balance.svelte';
	import ContributorCard from '#lib/components/ContributorCard.svelte';
	import RepoCard from '#lib/components/RepoCard.svelte';
	import { loadContributors } from '#lib/contributors.ts';
	import {
		isRepositoryName,
		loadRepository,
		normalizeRepository,
		type RepoResult
	} from '#lib/repository.ts';
	import { formatPrice, prices } from '#lib/services/prices.svelte.ts';
	import { sendReward } from '#lib/services/reward.ts';
	import { modal, wallet } from '#lib/services/wallet.svelte.ts';
	import { toaster } from '#lib/toaster.ts';
	import type { Balance, Contributor } from '#lib/types.ts';
	import { snapshot } from '$app/navigation';
	import { page } from '$app/state';

	let repository = $state(normalizeRepository(page.url.searchParams.get('repository') ?? ''));
	let repoState = $state<{ status: 'idle' | 'loading' } | RepoResult>({ status: 'idle' });
	let contributors = $state<Contributor[]>([]);
	let creatingLinks = $state(false);

	let multiReward = $state(false);
	let singleRewardAmount = $state<{ amount: number; token?: Balance }>({ amount: 0 });

	let filter = $state('');
	let sort = $state<'commits' | 'name'>('commits');

	snapshot({
		capture: () => ({ repository, contributors: $state.snapshot(contributors), multiReward }),
		restore: (value) => {
			// the restored selection wins over a search started on mount
			searchId++;
			({ repository, contributors, multiReward } = value);
			const name = normalizeRepository(repository);
			if (isRepositoryName(name)) {
				repoState = { status: 'loading' };
				loadRepository(name).then((repo) => (repoState = repo));
			}
		}
	});

	let selectedContributors = $derived(contributors.filter((c) => c.checked));
	let isAllSelected = $derived(contributors.length > 0 && contributors.every((c) => c.checked));

	// keep the index in `contributors`: it is the rank by number of commits, and the binding target
	let visible = $derived.by(() => {
		const query = filter.trim().toLowerCase();
		const list = contributors
			.map((contributor, index) => ({ contributor, index }))
			.filter(
				({ contributor: c }) =>
					!query || [c.name, c.login, c.email].some((v) => v?.toLowerCase().includes(query))
			);
		if (sort === 'name') {
			list.sort((a, b) => a.contributor.name.localeCompare(b.contributor.name));
		}
		return list;
	});

	/** amount to send per token, for the summary */
	let totals = $derived.by(() => {
		const sums: Record<string, { token: Balance; amount: number }> = {};
		const add = (token: Balance | undefined, amount: number) => {
			if (!token || !(amount > 0)) return;
			sums[token.address] ??= { token, amount: 0 };
			sums[token.address].amount += amount;
		};
		if (multiReward) {
			selectedContributors.forEach((c) => add(c.reward?.token, c.reward?.amount ?? 0));
		} else {
			add(singleRewardAmount.token, singleRewardAmount.amount * selectedContributors.length);
		}
		return Object.values(sums).map((t) => {
			const price = prices.price(t.token);
			return { ...t, value: price !== undefined ? t.amount * price : undefined };
		});
	});
	// only add up the fiat values when every token could be priced
	let totalValue = $derived(
		totals.length > 1 && totals.every((t) => t.value !== undefined)
			? totals.reduce((sum, t) => sum + (t.value ?? 0), 0)
			: undefined
	);
	let insufficient = $derived(totals.filter((t) => t.amount > t.token.amount));
	let withoutAmount = $derived(
		multiReward
			? selectedContributors.filter((c) => !c.reward?.token || !(c.reward.amount > 0)).length
			: 0
	);

	const formatAmount = new Intl.NumberFormat('en', { maximumFractionDigits: 6 }).format;

	function setSelectAll(checked: boolean) {
		contributors.forEach((c) => (c.checked = checked));
	}

	async function onReward() {
		if (!wallet.isConnected) {
			await modal.open();
			return;
		}
		creatingLinks = true;
		try {
			const sent = await reward();
			if (sent > 0) {
				toaster.success({ title: `${sent} contributor(s) rewarded` });
			}
		} catch (error) {
			console.error(error);
			toaster.error({ title: 'Failed to generate rewards', description: (error as Error).message });
		} finally {
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
				repository: normalizeRepository(repository)
			});
			rewarded += links.length;
		}
		return rewarded;
	}

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
		contributors = repo.status === 'ok' ? list.map((c) => ({ ...c, reward: { amount: 0 } })) : [];
	}

	const debouncedSearch = debounce(search, 400);

	onMount(() => {
		if (repository) search();
	});

	function onPaste(event: ClipboardEvent) {
		const text = event.clipboardData?.getData('text');
		if (!text) return;
		event.preventDefault();
		repository = normalizeRepository(text);
		search();
	}
</script>

<svelte:head>
	<title>Advanced rewards · CommitKudos</title>
	<meta property="og:title" content="Advanced rewards · CommitKudos" />
</svelte:head>

<div class="grid flex-1 grid-cols-1 items-start gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
	<aside
		class="space-y-6 rounded-container border border-surface-200-800 bg-surface-50-950/70 p-5 shadow-xl backdrop-blur-sm lg:sticky lg:top-24"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight">Advanced rewards</h1>
			<p class="mt-1 text-sm text-surface-600-400">
				Hand-pick contributors and choose the same amount for everyone, or a different one for each.
			</p>
		</div>

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
				/>
			</div>
			{#if repoState.status === 'ok'}
				<RepoCard repo={repoState.repo} />
			{:else if repoState.status === 'not-found'}
				<p class="flex items-center gap-1.5 text-sm text-error-600-400">
					<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
					Repository not found.
				</p>
			{:else if repoState.status === 'error'}
				<p class="flex items-center gap-1.5 text-sm text-error-600-400">
					<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
					Could not reach GitHub: {repoState.message}
				</p>
			{/if}
		</div>

		<div class="space-y-3">
			<div
				class="grid grid-cols-2 gap-1 rounded-base bg-surface-100-900 p-1"
				role="group"
				aria-label="Reward mode"
			>
				{#each [{ multi: false, label: 'Same amount' }, { multi: true, label: 'Per contributor' }] as mode (mode.label)}
					<button
						type="button"
						class="btn btn-sm {multiReward === mode.multi
							? 'preset-filled-surface-50-950 shadow-sm'
							: 'text-surface-600-400'}"
						aria-pressed={multiReward === mode.multi}
						onclick={() => (multiReward = mode.multi)}
					>
						{mode.label}
					</button>
				{/each}
			</div>
			{#if !multiReward}
				<div>
					<label for="amount" class="mb-1.5 block text-sm font-medium">
						Amount per contributor
					</label>
					<BalanceInput
						id="amount"
						bind:token={singleRewardAmount.token}
						bind:amount={singleRewardAmount.amount}
						recipients={selectedContributors.length}
					/>
				</div>
			{:else}
				<p class="text-sm text-surface-600-400">Set the amount on each selected contributor.</p>
			{/if}
		</div>

		<div class="space-y-3 border-t border-surface-200-800 pt-5">
			<div class="flex items-center justify-between gap-3">
				<span class="text-sm font-medium">
					{selectedContributors.length} contributor{selectedContributors.length === 1 ? '' : 's'}
					selected
				</span>
				{#if selectedContributors.length > 0}
					<div class="flex -space-x-2">
						{#each selectedContributors.slice(0, 6) as c (c.login || c.email)}
							{#if c.avatarUrl}
								<img
									src={c.avatarUrl}
									alt={c.name}
									title={c.name}
									class="size-7 rounded-full ring-2 ring-surface-50-950"
								/>
							{:else}
								<span
									class="flex size-7 items-center justify-center rounded-full preset-tonal text-xs font-semibold ring-2 ring-surface-50-950"
									title={c.name}
								>
									{c.name.charAt(0).toUpperCase()}
								</span>
							{/if}
						{/each}
						{#if selectedContributors.length > 6}
							<span
								class="flex size-7 items-center justify-center rounded-full bg-surface-200-800 text-xs font-semibold ring-2 ring-surface-50-950"
							>
								+{selectedContributors.length - 6}
							</span>
						{/if}
					</div>
				{/if}
			</div>

			{#if totals.length > 0}
				<ul class="space-y-1 rounded-base bg-surface-100-900 px-4 py-3 text-sm">
					{#each totals as total (total.token.address)}
						<li class="flex justify-between gap-2">
							<span class="text-surface-600-400">Total {total.token.symbol}</span>
							<span class="text-right tabular-nums">
								<span class="font-semibold">
									{formatAmount(total.amount)}
									{total.token.symbol}
								</span>
								{#if total.value !== undefined}
									<span class="block text-xs text-surface-600-400">
										≈ {formatPrice(total.value, prices.currency)}
									</span>
								{/if}
							</span>
						</li>
					{/each}
					{#if totalValue !== undefined}
						<li
							class="flex justify-between gap-2 border-t border-surface-200-800 pt-1 font-semibold"
						>
							<span>Total</span>
							<span class="tabular-nums">≈ {formatPrice(totalValue, prices.currency)}</span>
						</li>
					{/if}
				</ul>
			{/if}
			{#each insufficient as total (total.token.address)}
				<p class="flex items-center gap-1.5 text-sm text-warning-700-300">
					<TriangleAlert class="size-4 shrink-0" aria-hidden="true" />
					Not enough {total.token.symbol}: your balance is {formatAmount(total.token.amount)}.
				</p>
			{/each}
			{#if withoutAmount > 0}
				<p class="flex items-center gap-1.5 text-sm text-surface-600-400">
					<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
					{withoutAmount} selected contributor{withoutAmount > 1 ? 's have' : ' has'} no amount and will
					be skipped.
				</p>
			{/if}

			<button
				type="button"
				class="btn w-full preset-filled-primary-500"
				onclick={onReward}
				disabled={wallet.isConnected &&
					(creatingLinks || totals.length === 0 || insufficient.length > 0)}
			>
				{#if !wallet.isConnected}
					<Wallet class="size-4" aria-hidden="true" />
					Connect wallet
				{:else if creatingLinks}
					<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
					Confirm in your wallet…
				{:else}
					Reward and email contributors
				{/if}
			</button>
		</div>
	</aside>

	<section class="flex min-h-full flex-col gap-4">
		{#if contributors.length > 0}
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative min-w-48 flex-1">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-500"
						aria-hidden="true"
					/>
					<input
						type="search"
						class="input pl-9"
						placeholder="Filter by name, login or email"
						aria-label="Filter contributors"
						bind:value={filter}
					/>
				</div>
				<select class="select w-auto" aria-label="Sort contributors" bind:value={sort}>
					<option value="commits">Most commits</option>
					<option value="name">Name</option>
				</select>
				<button type="button" class="btn preset-tonal" onclick={() => setSelectAll(!isAllSelected)}>
					{isAllSelected ? 'Select none' : 'Select all'}
				</button>
			</div>
		{/if}

		{#if repoState.status === 'loading'}
			<div
				class="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3"
				aria-label="Loading contributors"
			>
				{#each { length: 6 }, i (i)}
					<div
						class="flex animate-pulse items-start gap-3 rounded-container border border-surface-200-800 p-4"
					>
						<div class="size-12 rounded-full bg-surface-200-800"></div>
						<div class="flex-1 space-y-2 py-1">
							<div class="h-3 w-1/2 rounded bg-surface-200-800"></div>
							<div class="h-2.5 w-1/3 rounded bg-surface-200-800"></div>
							<div class="h-2.5 w-2/3 rounded bg-surface-200-800"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if contributors.length === 0}
			<div
				class="flex flex-1 flex-col items-center justify-center gap-2 rounded-container border border-dashed border-surface-300-700 p-10 text-center"
			>
				<Users class="size-8 text-surface-500" aria-hidden="true" />
				{#if repoState.status === 'ok'}
					<p class="text-lg font-semibold">No commits in the last 30 days</p>
					<p class="text-sm text-surface-600-400">Try a more active repository.</p>
				{:else}
					<p class="text-lg font-semibold">No repository selected</p>
					<p class="text-sm text-surface-600-400">
						Enter a GitHub repository to list its contributors of the last 30 days.
					</p>
				{/if}
			</div>
		{:else if visible.length === 0}
			<p class="py-10 text-center text-surface-600-400">No contributor matches “{filter}”.</p>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
				{#each visible as { contributor, index } (contributor.login || contributor.email)}
					<ContributorCard
						bind:contributor={contributors[index]}
						rank={index + 1}
						reward={multiReward}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>
