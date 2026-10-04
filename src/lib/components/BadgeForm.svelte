<script lang="ts">
	import type { Badge } from '#lib/types.ts';

	let { badge = $bindable() }: { badge: Badge } = $props();
</script>

<form class="space-y-3" onsubmit={(e) => e.preventDefault()}>
	<label class="label">
		<span class="label-text">Repository</span>
		<input type="text" class="input" placeholder="owner/name" bind:value={badge.badgeContent} />
	</label>
	<label class="label">
		<span class="label-text">Background Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.color}
		/>
	</label>
	<label class="label">
		<span class="label-text">Style</span>
		<select class="select" bind:value={badge.style}>
			<option value="flat">flat</option>
			<option value="flat-square">flat-square</option>
			<option value="plastic">plastic</option>
			<option value="for-the-badge">big</option>
			<option value="social">social</option>
		</select>
	</label>
	<label class="label">
		<span class="label-text">
			Logo from <a class="anchor" href="https://simpleicons.org/" target="_blank">simpleicons</a>
		</span>
		<input type="text" class="input" placeholder="github" bind:value={badge.logo} />
	</label>
	<label class="label">
		<span class="label-text">Logo Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.logoColor}
		/>
	</label>
	<label class="label">
		<span class="label-text">Label</span>
		<input type="text" class="input" placeholder="Give kudos" bind:value={badge.label} />
	</label>
	<label class="label">
		<span class="label-text">Label Color</span>
		<input
			type="text"
			class="input"
			placeholder="hex, rgb, rgba, hsl, hsla or css named color"
			bind:value={badge.labelColor}
		/>
	</label>
</form>
