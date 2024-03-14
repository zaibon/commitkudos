<script lang="ts">
	import type { BalanceResult } from '@socket.tech/socket-v2-sdk';
	import { createEventDispatcher } from 'svelte';

	import type { Contributor } from '$lib/types';

	import Balance from './Balance.svelte';

	const dispatch = createEventDispatcher();
	export let contributor: Contributor;
	export let selected: boolean = false;
	export let tabindex = 0;
	export let reward: boolean = false;
	let selectedToken: BalanceResult;
	let rewardAmount: number;
	function onKeyPress() {
		dispatch('selected', selected);
	}
</script>

<div
	class="card card-hover"
	class:variant-filled={!selected}
	class:variant-filled-surface={selected}
>
	<header class="card-header flex">
		<a href="https://github.com/{contributor?.login}">
			<h3 class="hover:underline">@{contributor?.login}</h3>
		</a>
	</header>
	<section class="p-4">
		<div
			class="flex flex-row justify-between gap-3"
			role="button"
			on:click={() => (selected = !selected)}
			on:keypress={onKeyPress}
			{tabindex}
		>
			<figure class="avatar flex aspect-square overflow-hidden h-12 lg:h-32 rounded">
				<img
					class="avatar-image w-full h-full object-cover"
					src={contributor?.avatarUrl}
					alt="avatar"
				/>
			</figure>
			<div class="flex flex-col justify-start">
				<p>Name: <span class="font-semibold">{contributor?.name}</span></p>
				<p>Email: {contributor?.email}</p>
				<!-- <span class="mr-2">Twitter: {contributor?.twitter}</span>
				<span class="mr-2">Discord: {contributor?.discord}</span> -->
			</div>
		</div>
		{#if reward}
			<div class="mt-3 flex flex-row justify-end gap-x-1">
				<input
					class="input rounded-sm"
					class:variant-filled={!selected}
					class:variant-filled-surface={selected}
					type="text"
					inputmode="numeric"
					placeholder="Amount"
				/>
				<Balance bind:token={selectedToken} bind:amount={rewardAmount} />
			</div>
		{/if}
	</section>
	<footer class="card-footer border-t border-black p-2">
		<p>
			<span class="chip variant-filled-secondary">{contributor.numberOfContributions}</span>
			Contribution{#if contributor.numberOfContributions > 1}s{/if}
			over last 30 days
		</p>
	</footer>
</div>
