<script lang="ts" module>
	export type StepStatus = 'pending' | 'active' | 'done';
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';

	let {
		number,
		title,
		hint,
		status,
		last = false,
		aside,
		children
	}: {
		number: number;
		title: string;
		/** shown in place of the content while the step is pending */
		hint: string;
		status: StepStatus;
		last?: boolean;
		/** rendered on the right of the title */
		aside?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="relative pl-12" aria-current={status === 'active' ? 'step' : undefined}>
	{#if !last}
		<div
			class="absolute top-10 bottom-2 left-4 w-px transition-colors {status === 'done'
				? 'bg-secondary-500'
				: 'bg-surface-200-800'}"
			aria-hidden="true"
		></div>
	{/if}
	<div
		class="absolute top-0 left-0 flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors {status ===
		'done'
			? 'preset-filled-secondary-500'
			: status === 'active'
				? 'preset-filled-primary-500 ring-4 ring-primary-500/20'
				: 'border border-surface-300-700 text-surface-500'}"
	>
		{#if status === 'done'}
			<Check class="size-4" strokeWidth={3} aria-label="Done" />
		{:else}
			{number}
		{/if}
	</div>
	<header class="flex min-h-8 items-center justify-between gap-3">
		<h2 class="font-semibold {status === 'pending' ? 'text-surface-500' : ''}">{title}</h2>
		{@render aside?.()}
	</header>
	<div class={last ? 'pt-3' : 'pt-3 pb-8'}>
		{#if status === 'pending'}
			<p class="text-sm text-surface-500">{hint}</p>
		{:else}
			<div transition:slide={{ duration: 200 }}>
				{@render children()}
			</div>
		{/if}
	</div>
</section>
