<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import type { Badge } from '$lib/types';

	const dispatch = createEventDispatcher();

	const badge: Badge = {
		badgeContent: '',
		style: 'flat',
		logo: '',
		logoColor: '',
		label: '',
		labelColor: '',
		color: '',
		cacheSeconds: 3600
	};
	$: if (badge) {
		dispatch('input', badge);
	}
</script>

<form>
	<label class="label">
		<span>Repository</span>
		<input type="text" class="input" placeholder="owner/name" bind:value={badge.badgeContent} />
	</label>
	<label class="label">
		<span>Background Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.color}
		/>
	</label>
	<label class="label">
		<span>Style</span>
		<select class="select" bind:value={badge.style}>
			<option value="flat">flat</option>
			<option value="flat-square">flat-square</option>
			<option value="plastic">plastic</option>
			<option value="for-the-badge">big</option>
			<option value="social">social</option>
		</select>
	</label>
	<label class="label">
		<span>Logo from <a class="underline" href="https://simpleicons.org/">simpleicons</a></span>
		<input type="text" class="input" placeholder="github" bind:value={badge.logo} />
	</label>
	<label class="label">
		<span>Logo Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.logoColor}
		/>
	</label>
	<label class="label">
		<span>Label</span>
		<input type="text" class="input" placeholder="Give kudos" bind:value={badge.label} />
	</label>
	<label class="label">
		<span>Label Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.labelColor}
		/>
	</label>
</form>
