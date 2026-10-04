<script lang="ts">
	import type { Contributor } from '#lib/types.ts';

	let {
		contributor = $bindable(),
		rank,
		max,
		disabled = false
	}: {
		contributor: Contributor;
		rank: number;
		/** highest number of contributions in the list, used to scale the activity bar */
		max: number;
		disabled?: boolean;
	} = $props();

	let share = $derived(max > 0 ? (contributor.numberOfContributions / max) * 100 : 0);
</script>

<label
	class="flex items-center gap-3 rounded-base px-2 py-2 transition-colors {disabled
		? ''
		: 'cursor-pointer hover:bg-surface-100-900'} {contributor.checked ? '' : 'opacity-60'}"
>
	<span class="w-5 shrink-0 text-right text-xs text-surface-500 tabular-nums">{rank}</span>
	{#if contributor.avatarUrl}
		<img src={contributor.avatarUrl} alt="" class="size-9 shrink-0 rounded-full" loading="lazy" />
	{:else}
		<span
			class="flex size-9 shrink-0 items-center justify-center rounded-full preset-tonal text-sm font-semibold"
			aria-hidden="true"
		>
			{contributor.name.charAt(0).toUpperCase()}
		</span>
	{/if}
	<span class="min-w-0 flex-1">
		<span class="block truncate font-medium">{contributor.name}</span>
		<span class="block truncate text-xs text-surface-600-400">
			{contributor.login ? `@${contributor.login}` : contributor.email}
		</span>
	</span>
	<span class="hidden w-28 shrink-0 sm:block" aria-hidden="true">
		<span class="block h-1.5 overflow-hidden rounded-full bg-surface-200-800">
			<span class="block h-full rounded-full bg-secondary-500" style:width="{share}%"></span>
		</span>
	</span>
	<span class="shrink-0 text-right text-sm whitespace-nowrap tabular-nums sm:w-24">
		{contributor.numberOfContributions}
		<span class="text-xs text-surface-500">
			{contributor.numberOfContributions > 1 ? 'commits' : 'commit'}
		</span>
	</span>
	<input
		type="checkbox"
		class="checkbox"
		bind:checked={contributor.checked}
		{disabled}
		aria-label="Reward {contributor.name}"
	/>
</label>
