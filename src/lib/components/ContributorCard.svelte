<script lang="ts">
	import type { Contributor } from '$lib/types';

	export let contributor: Contributor;
	export let selected: boolean = false;
	export let tabindex = 0;
	function onKeyPress() {}
</script>

<div
	class="card variant-filled"
	class:variant-filled={!selected}
	class:variant-filled-surface={selected}
	on:click={() => (selected = !selected)}
	on:keypress={onKeyPress}
	{tabindex}
	role="button"
>
	<section class="p-4">
		<div class="flex flex-row justify-between gap-3">
			<figure class="avatar flex aspect-square overflow-hidden h-12 lg:h-32 rounded">
				<img
					class="avatar-image w-full h-full object-cover"
					src={contributor?.avatarUrl}
					alt="avatar"
				/>
			</figure>
			<div class="flex flex-col">
				<span class="mr-2">Name: {contributor?.name}</span>
				<span class="mr-2">Email: {contributor?.email}</span>
				<!-- <span class="mr-2">Twitter: {contributor?.twitter}</span>
				<span class="mr-2">Discord: {contributor?.discord}</span> -->
			</div>
		</div>
	</section>
	<footer class="card-footer border-t border-black p-2">
		<p>
			<span class="chip variant-filled-secondary">{contributor.numberOfContributions}</span>
			Contribution{#if contributor.numberOfContributions > 1}s{/if}
			over last 30 days
		</p>
	</footer>
</div>
