<script lang="ts">
	import { badgeImageURL, badgeLink } from '#lib/badge.ts';
	import { isRepositoryName, normalizeRepository } from '#lib/repository.ts';
	import type { Badge } from '#lib/types.ts';
	import { page } from '$app/state';

	import BadgeCode from './BadgeCode.svelte';
	import BadgeForm from './BadgeForm.svelte';

	let badge: Badge = $state({
		badgeContent: normalizeRepository(page.url.searchParams.get('repository') ?? ''),
		style: 'flat',
		logo: 'github',
		logoColor: 'white',
		label: 'Give some kudos',
		labelColor: '',
		color: '1d6fe0',
		cacheSeconds: 3600
	});

	let hasRepository = $derived(isRepositoryName(badge.badgeContent));
	// preview with a placeholder until a repository is entered
	let previewURL = $derived(
		badgeImageURL({ ...badge, badgeContent: badge.badgeContent || 'owner/name' })
	);
	let imageURL = $derived(hasRepository ? badgeImageURL(badge) : undefined);
	let link = $derived(badgeLink(badge.badgeContent));
</script>

<div class="grid items-start gap-8 lg:grid-cols-[1fr_28rem]">
	<div
		class="rounded-container border border-surface-200-800 bg-surface-50-950/70 p-5 shadow-xl backdrop-blur-sm sm:p-8"
	>
		<BadgeForm bind:badge />
	</div>

	<div class="space-y-4 lg:sticky lg:top-24">
		<div class="overflow-hidden rounded-container border border-surface-200-800">
			{#each [{ bg: 'bg-white', theme: 'light' }, { bg: 'bg-[#0d1117]', theme: 'dark' }] as readme (readme.theme)}
				<div class="flex min-h-20 items-center justify-center p-4 {readme.bg}">
					{#if previewURL}
						<img
							src={previewURL}
							alt="Badge preview on a {readme.theme} README"
							class="h-7 w-auto max-w-full"
						/>
					{/if}
				</div>
			{/each}
			<p
				class="border-t border-surface-200-800 bg-surface-100-900 px-4 py-2 text-xs text-surface-600-400"
			>
				Preview on a light and a dark GitHub README
			</p>
		</div>

		{#if imageURL}
			<BadgeCode {imageURL} {link} />
		{:else}
			<p
				class="rounded-container border border-dashed border-surface-300-700 p-4 text-center text-sm text-surface-600-400"
			>
				Enter your repository{badge.color ? '' : ' and a background color'} to get the code to paste in
				your README.
			</p>
		{/if}
	</div>
</div>
