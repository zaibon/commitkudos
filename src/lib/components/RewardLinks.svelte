<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';

	import { copyToClipboard } from '#lib/clipboard.ts';
	import type { Contributor } from '#lib/types.ts';

	let { contributors, links }: { contributors: Contributor[]; links: string[] } = $props();

	function copyAll() {
		const text = links
			.map((link, i) => `${contributors[i]?.name} <${contributors[i]?.email}>: ${link}`)
			.join('\n');
		copyToClipboard(text, `${links.length} links copied`);
	}
</script>

<div class="overflow-hidden rounded-container border border-surface-200-800">
	<div
		class="flex items-center justify-between gap-2 border-b border-surface-200-800 bg-surface-100-900 px-3 py-2"
	>
		<span class="text-sm font-medium">Reward links</span>
		<button type="button" class="btn preset-tonal btn-sm" onclick={copyAll}>
			<Copy class="size-4" aria-hidden="true" />
			Copy all
		</button>
	</div>
	<ul class="divide-y divide-surface-200-800">
		{#each links as link, i (link)}
			{@const contributor = contributors[i]}
			<li class="flex items-center gap-3 px-3 py-2">
				{#if contributor?.avatarUrl}
					<img src={contributor.avatarUrl} alt="" class="size-7 shrink-0 rounded-full" />
				{/if}
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium">{contributor?.name}</div>
					<div class="truncate font-mono text-xs text-surface-600-400" title={link}>{link}</div>
				</div>
				<button
					type="button"
					class="btn-icon btn-icon-sm hover:preset-tonal"
					title="Copy link"
					aria-label="Copy the link for {contributor?.name}"
					onclick={() => copyToClipboard(link)}
				>
					<Copy class="size-4" aria-hidden="true" />
				</button>
			</li>
		{/each}
	</ul>
</div>
