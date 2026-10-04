<script lang="ts">
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import GitFork from '@lucide/svelte/icons/git-fork';
	import Star from '@lucide/svelte/icons/star';

	import type { RepoInfo } from '#lib/types.ts';

	let { repo }: { repo: RepoInfo } = $props();

	const compact = new Intl.NumberFormat('en', { notation: 'compact' });
</script>

<div class="flex items-start gap-3 rounded-container border border-surface-200-800 p-3">
	{#if repo.avatarUrl}
		<img src={repo.avatarUrl} alt="" class="size-10 shrink-0 rounded-base" />
	{/if}
	<div class="min-w-0 flex-1">
		<a
			href={repo.htmlUrl}
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-1 font-semibold hover:underline"
		>
			{repo.fullName}
			<ExternalLink class="size-3.5 text-surface-500" aria-hidden="true" />
		</a>
		{#if repo.description}
			<p class="line-clamp-2 text-sm text-surface-600-400">{repo.description}</p>
		{/if}
		<div class="mt-1 flex gap-4 text-xs text-surface-600-400">
			<span class="inline-flex items-center gap-1" title="{repo.stars} stars">
				<Star class="size-3.5" aria-hidden="true" />
				{compact.format(repo.stars)}
			</span>
			<span class="inline-flex items-center gap-1" title="{repo.forks} forks">
				<GitFork class="size-3.5" aria-hidden="true" />
				{compact.format(repo.forks)}
			</span>
		</div>
	</div>
</div>
