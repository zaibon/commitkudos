<script lang="ts">
	import { badgeImageURL, badgeStyles } from '#lib/badge.ts';
	import { normalizeRepository } from '#lib/repository.ts';
	import type { Badge } from '#lib/types.ts';

	import ColorInput from './ColorInput.svelte';

	let { badge = $bindable() }: { badge: Badge } = $props();

	function onPaste(event: ClipboardEvent) {
		const text = event.clipboardData?.getData('text');
		if (!text) return;
		event.preventDefault();
		badge.badgeContent = normalizeRepository(text);
	}
</script>

{#snippet field(id: string, label: string)}
	<label for={id} class="mb-1.5 block text-sm font-medium">{label}</label>
{/snippet}

<form class="space-y-8" onsubmit={(e) => e.preventDefault()}>
	<fieldset class="space-y-4">
		<legend class="mb-4 text-xs font-semibold tracking-wider text-surface-500 uppercase">
			Content
		</legend>
		<div>
			{@render field('badge-repository', 'Repository')}
			<div class="field-group grid-cols-[auto_1fr]">
				<span class="label preset-tonal font-mono text-sm">github.com/</span>
				<input
					id="badge-repository"
					type="text"
					class="input"
					placeholder="owner/name"
					autocomplete="off"
					spellcheck="false"
					bind:value={badge.badgeContent}
					onpaste={onPaste}
				/>
			</div>
		</div>
		<div>
			{@render field('badge-label', 'Label')}
			<input
				id="badge-label"
				type="text"
				class="input"
				placeholder="Give some kudos"
				bind:value={badge.label}
			/>
		</div>
	</fieldset>

	<fieldset class="space-y-4">
		<legend class="mb-4 text-xs font-semibold tracking-wider text-surface-500 uppercase">
			Style
		</legend>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Badge style">
			{#each badgeStyles as style (style.value)}
				{@const url = badgeImageURL({
					...badge,
					badgeContent: badge.badgeContent || 'owner/name',
					style: style.value
				})}
				<button
					type="button"
					role="radio"
					aria-checked={badge.style === style.value}
					class="flex flex-col items-center gap-2 rounded-base border p-3 transition-colors {badge.style ===
					style.value
						? 'border-primary-500 bg-primary-500/5'
						: 'border-surface-200-800 hover:border-surface-300-700'}"
					onclick={() => (badge.style = style.value)}
				>
					<span class="flex h-8 items-center">
						{#if url}
							<img src={url} alt="" class="max-h-7 max-w-full" />
						{/if}
					</span>
					<span class="text-xs text-surface-600-400">{style.label}</span>
				</button>
			{/each}
		</div>
		<div>
			{@render field('badge-logo', 'Logo')}
			<input
				id="badge-logo"
				type="text"
				class="input"
				placeholder="github"
				autocomplete="off"
				spellcheck="false"
				bind:value={badge.logo}
			/>
			<p class="mt-1 text-xs text-surface-600-400">
				Any icon name from <a
					class="anchor"
					href="https://simpleicons.org/"
					target="_blank"
					rel="noreferrer">simpleicons.org</a
				>.
			</p>
		</div>
	</fieldset>

	<fieldset class="space-y-4">
		<legend class="mb-4 text-xs font-semibold tracking-wider text-surface-500 uppercase">
			Colors
		</legend>
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				{@render field('badge-color', 'Background')}
				<ColorInput id="badge-color" bind:value={badge.color} />
			</div>
			<div>
				{@render field('badge-label-color', 'Label')}
				<ColorInput id="badge-label-color" bind:value={badge.labelColor} placeholder="default" />
			</div>
			<div>
				{@render field('badge-logo-color', 'Logo')}
				<ColorInput id="badge-logo-color" bind:value={badge.logoColor} placeholder="default" />
			</div>
		</div>
	</fieldset>
</form>
