<script lang="ts">
	import BadgeGenerator from '#lib/components/BadgeGenerator.svelte';
</script>

<svelte:head>
	<title>README badge · CommitKudos</title>
	<meta property="og:title" content="README badge · CommitKudos" />
</svelte:head>

<div class="mx-auto w-full max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">README badge</h1>
		<p class="mt-2 text-surface-600-400">
			Add a badge to your repository so its users can reward your top contributors in one click.
		</p>
	</div>
	<BadgeGenerator />
</div>
