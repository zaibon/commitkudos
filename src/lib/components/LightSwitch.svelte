<script lang="ts">
	const STORAGE_KEY = 'modeCurrent';

	function readMode(): boolean {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored !== null) return stored === 'dark';
		} catch {
			// storage unavailable
		}
		return document.documentElement.classList.contains('dark');
	}

	let dark = $state(readMode());

	$effect(() => {
		document.documentElement.classList.toggle('dark', dark);
		try {
			localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
		} catch {
			// storage unavailable
		}
	});
</script>

<button
	type="button"
	class="btn-icon text-surface-600-400 transition-colors hover:preset-tonal hover:text-surface-950-50"
	title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-label="Toggle light / dark mode"
	onclick={() => (dark = !dark)}
>
	{#if dark}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-5 fill-current">
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			class="size-5 fill-none stroke-current stroke-2"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
			/>
		</svg>
	{/if}
</button>
