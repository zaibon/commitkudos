<script lang="ts">
	import { CodeBlock, Tab, TabGroup } from '@skeletonlabs/skeleton';

	export let imageURL: string | undefined;
	export let link: string | undefined;

	let tabSet = 0;

	$: html = `<a href="${link}" target="_blank"><img src="${imageURL}"</a>`;
	$: markdown = `[![commitKudosBadge](${imageURL})](${link})`;
</script>

<TabGroup>
	<Tab bind:group={tabSet} name="html" value={0}>HTML</Tab>
	<Tab bind:group={tabSet} name="markdown" value={1}>Markdown</Tab>
	<!-- Tab Panels --->
	<svelte:fragment slot="panel">
		{#if tabSet === 0}
			<CodeBlock language="html" code={html} />
		{:else if tabSet === 1}
			<CodeBlock language="markdown" code={markdown} />
		{/if}
	</svelte:fragment>
</TabGroup>
