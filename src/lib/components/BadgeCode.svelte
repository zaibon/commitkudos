<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	import { toaster } from '#lib/toaster.ts';

	let { imageURL, link }: { imageURL?: string; link?: string } = $props();

	let tab = $state('html');

	let snippets = $derived({
		html: `<a href="${link}" target="_blank"><img src="${imageURL}" alt="CommitKudos badge" /></a>`,
		markdown: `[![commitKudosBadge](${imageURL})](${link})`
	});

	async function copy(code: string) {
		await navigator.clipboard.writeText(code);
		toaster.success({ title: 'Copied to clipboard', duration: 1500 });
	}
</script>

<Tabs value={tab} onValueChange={(e) => (tab = e.value)}>
	<Tabs.List>
		<Tabs.Trigger value="html">HTML</Tabs.Trigger>
		<Tabs.Trigger value="markdown">Markdown</Tabs.Trigger>
		<Tabs.Indicator />
	</Tabs.List>
	{#each Object.entries(snippets) as [name, code] (name)}
		<Tabs.Content value={name}>
			<div class="relative">
				<pre class="pre pr-16 break-all whitespace-pre-wrap">{code}</pre>
				<button
					type="button"
					class="absolute top-2 right-2 btn bg-white/10 text-white btn-sm hover:bg-white/20"
					onclick={() => copy(code)}
				>
					Copy
				</button>
			</div>
		</Tabs.Content>
	{/each}
</Tabs>
