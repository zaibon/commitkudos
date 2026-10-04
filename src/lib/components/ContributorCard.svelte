<script lang="ts">
	import type { Contributor } from '#lib/types.ts';

	import BalanceInput from './Balance.svelte';

	let {
		contributor = $bindable(),
		rank,
		reward = false
	}: {
		contributor: Contributor;
		/** position by number of commits */
		rank: number;
		/** show the per-contributor reward input when selected */
		reward?: boolean;
	} = $props();
</script>

<div
	class="flex flex-col gap-3 rounded-container border p-4 transition-colors {contributor.checked
		? 'border-primary-500 bg-primary-500/5'
		: 'border-surface-200-800 hover:border-surface-300-700'}"
>
	<label class="flex cursor-pointer items-start gap-3">
		{#if contributor.avatarUrl}
			<img
				src={contributor.avatarUrl}
				alt=""
				class="size-12 shrink-0 rounded-full"
				loading="lazy"
			/>
		{:else}
			<span
				class="flex size-12 shrink-0 items-center justify-center rounded-full preset-tonal text-lg font-semibold"
				aria-hidden="true"
			>
				{contributor.name.charAt(0).toUpperCase()}
			</span>
		{/if}
		<span class="min-w-0 flex-1">
			<span class="block truncate font-semibold">{contributor.name}</span>
			{#if contributor.login}
				<a
					href="https://github.com/{contributor.login}"
					target="_blank"
					rel="noreferrer"
					class="block truncate text-xs text-surface-600-400 hover:underline"
				>
					@{contributor.login}
				</a>
			{/if}
			<span class="block truncate text-xs text-surface-500" title={contributor.email}>
				{contributor.email}
			</span>
		</span>
		<input
			class="checkbox"
			type="checkbox"
			aria-label="Reward {contributor.name}"
			bind:checked={contributor.checked}
		/>
	</label>
	<div class="flex items-center justify-between text-xs text-surface-600-400">
		<span class="badge preset-tonal-secondary tabular-nums">#{rank}</span>
		<span class="tabular-nums">
			<span class="font-semibold text-surface-950-50">{contributor.numberOfContributions}</span>
			commit{contributor.numberOfContributions > 1 ? 's' : ''} in 30 days
		</span>
	</div>
	{#if reward && contributor.checked && contributor.reward}
		<BalanceInput bind:token={contributor.reward.token} bind:amount={contributor.reward.amount} />
	{/if}
</div>
