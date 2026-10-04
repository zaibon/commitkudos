<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	import { copyToClipboard } from '#lib/clipboard.ts';

	let { imageURL, link }: { imageURL: string; link: string } = $props();

	let tab = $state('markdown');

	let snippets = $derived({
		markdown: `[![Give some kudos](${imageURL})](${link})`,
		html: `<a href="${link}" target="_blank"><img src="${imageURL}" alt="Give some kudos" /></a>`
	});
</script>

<Tabs value={tab} onValueChange={(e) => (tab = e.value)}>
	<Tabs.List>
		<Tabs.Trigger value="markdown">Markdown</Tabs.Trigger>
		<Tabs.Trigger value="html">HTML</Tabs.Trigger>
		<Tabs.Indicator />
	</Tabs.List>
	{#each Object.entries(snippets) as [name, code] (name)}
		<Tabs.Content value={name}>
			<div class="relative">
				<pre
					class="pre pr-12 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">{code}</pre>
				<button
					type="button"
					class="absolute top-2 right-2 btn-icon bg-white/10 text-white btn-icon-sm hover:bg-white/20"
					title="Copy"
					aria-label="Copy the {name} code"
					onclick={() => copyToClipboard(code)}
				>
					<Copy class="size-4" aria-hidden="true" />
				</button>
			</div>
		</Tabs.Content>
	{/each}
</Tabs>
