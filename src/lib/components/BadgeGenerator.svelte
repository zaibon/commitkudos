<script lang="ts">
	import type { Badge } from '$lib/types';

	import BadgeCode from './BadgeCode.svelte';
	import BadgeForm from './BadgeForm.svelte';

	const baseURL = 'https://img.shields.io/badge';
	let badge: Badge;
	let imageURL: string | undefined = '';
	let link: string;
	let reward = 1.0;

	function buildBadge(badge: Badge): string | undefined {
		if (!badge || !badge.badgeContent || !badge.color) {
			return undefined;
		}
		let u = new URL(`${baseURL}/${badge.badgeContent}-${badge.color}`);
		Object.entries(badge).forEach(([key, value]) => {
			if (key === 'badgeContent' || key === 'color') {
				return;
			}
			if (value) {
				u.searchParams.set(key, value);
			}
		});
		return u.toString();
	}

	$: if (badge && badge.badgeContent) {
		imageURL = buildBadge(badge);
		link = `https://commitkudos.com?repository=${badge.badgeContent}&contributor=5&reward=${reward}`;
	}
</script>

<div class="flex flex-row gap-2">
	<div class="w-2/3">
		<BadgeForm on:input={(e) => (badge = e.detail)} />
	</div>
	<div class="w-1/3">
		<BadgeCode {imageURL} {link} />
		{#if imageURL}
			<a href={link} target="_blank">
				<img class="m-auto mt-5" src={imageURL} alt="badge" />
			</a>
		{/if}
	</div>
</div>
