<script lang="ts">
	import type { Contributor } from '#lib/types.ts';

	import BalanceInput from './Balance.svelte';

	let {
		contributor = $bindable(),
		reward = false
	}: {
		contributor: Contributor;
		reward?: boolean;
	} = $props();

	const toggle = () => (contributor.checked = !contributor.checked);
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	};
</script>

<div
	class="card border-2 transition-colors {contributor.checked
		? 'border-primary-500 preset-filled-surface-200-800'
		: 'border-transparent preset-filled-surface-100-900'}"
>
	<header class="flex items-center justify-between p-4 pb-0">
		{#if contributor.login}
			<a href="https://github.com/{contributor.login}" target="_blank" rel="noreferrer">
				<h3 class="h5 hover:underline">@{contributor.login}</h3>
			</a>
		{:else}
			<h3 class="h5">{contributor.name}</h3>
		{/if}
		<input
			class="checkbox"
			type="checkbox"
			aria-label="Select {contributor.login || contributor.name}"
			bind:checked={contributor.checked}
		/>
	</header>
	<section class="p-4">
		<div
			class="flex cursor-pointer flex-row justify-start gap-3"
			role="button"
			tabindex="0"
			onclick={toggle}
			onkeydown={onKeyDown}
		>
			<figure class="flex aspect-square h-12 shrink-0 overflow-hidden rounded lg:h-32">
				{#if contributor.avatarUrl}
					<img class="h-full w-full object-cover" src={contributor.avatarUrl} alt="avatar" />
				{:else}
					<div class="flex h-full w-full items-center justify-center preset-tonal text-2xl">
						{contributor.name.charAt(0).toUpperCase()}
					</div>
				{/if}
			</figure>
			<div class="flex min-w-0 flex-col justify-start">
				<p>Name: <span class="font-semibold">{contributor.name}</span></p>
				<p class="truncate">Email: {contributor.email}</p>
			</div>
		</div>
		{#if reward && contributor.reward}
			<div class="mt-3">
				<BalanceInput
					bind:token={contributor.reward.token}
					bind:amount={contributor.reward.amount}
				/>
			</div>
		{/if}
	</section>
	<footer class="border-t border-surface-300-700 p-4">
		<p>
			<span class="chip preset-filled-secondary-500">{contributor.numberOfContributions}</span>
			Contribution{#if contributor.numberOfContributions > 1}s{/if}
			over last 30 days
		</p>
	</footer>
</div>
