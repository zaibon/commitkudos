<script lang="ts">
	let {
		value = $bindable(''),
		id,
		placeholder = 'hex or color name'
	}: { value?: string; id?: string; placeholder?: string } = $props();

	// shields.io takes hex colors without the leading `#`
	let hex = $derived(/^#?[0-9a-f]{6}$/i.test(value) ? `#${value.replace('#', '')}` : undefined);
	let swatch = $derived(
		hex ??
			(value && typeof CSS !== 'undefined' && CSS.supports('color', value) ? value : 'transparent')
	);
</script>

<div class="field-group grid-cols-[auto_1fr]">
	<span class="relative label preset-tonal px-2" title="Pick a color">
		<span
			class="block size-5 rounded border border-surface-300-700"
			style:background={swatch}
			aria-hidden="true"
		></span>
		<input
			type="color"
			class="absolute inset-0 size-full cursor-pointer opacity-0"
			value={hex ?? '#000000'}
			oninput={(e) => (value = e.currentTarget.value.slice(1))}
			aria-label="Pick a color"
		/>
	</span>
	<input
		{id}
		type="text"
		class="input font-mono text-sm"
		autocomplete="off"
		spellcheck="false"
		{placeholder}
		bind:value
	/>
</div>
