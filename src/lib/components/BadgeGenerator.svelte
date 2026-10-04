<script lang="ts">
	import type { Badge } from '#lib/types.ts';

	import BadgeCode from './BadgeCode.svelte';
	import BadgeForm from './BadgeForm.svelte';

	const baseURL = 'https://img.shields.io/badge';
	const reward = 1.0;

	let badge: Badge = $state({
		badgeContent: '',
		style: 'flat',
		logo: '',
		logoColor: '',
		label: '',
		labelColor: '',
		color: '',
		cacheSeconds: 3600
	});

	// shields.io static badge path segments use `-` as separator: escape `-` and `_` as `--` and `__`
	function escapeSegment(value: string) {
		return encodeURIComponent(value.replaceAll('-', '--').replaceAll('_', '__'));
	}

	function buildBadge(badge: Badge): string | undefined {
		if (!badge.badgeContent || !badge.color) {
			return undefined;
		}
		const u = new URL(
			`${baseURL}/${escapeSegment(badge.badgeContent)}-${encodeURIComponent(badge.color)}`
		);
		Object.entries(badge).forEach(([key, value]) => {
			if (key === 'badgeContent' || key === 'color') {
				return;
			}
			if (value) {
				u.searchParams.set(key, String(value));
			}
		});
		return u.toString();
	}

	let imageURL = $derived(buildBadge(badge));
	let link = $derived.by(() => {
		const u = new URL('https://commitkudos.com');
		u.searchParams.set('repository', badge.badgeContent);
		u.searchParams.set('contributor', '5');
		u.searchParams.set('reward', reward.toString());
		return u.toString();
	});
</script>

<div class="flex flex-col gap-4 md:flex-row">
	<div class="md:w-2/3">
		<BadgeForm bind:badge />
	</div>
	<div class="md:w-1/3">
		<BadgeCode {imageURL} {link} />
		{#if imageURL}
			<a href={link} target="_blank">
				<img class="m-auto mt-5" src={imageURL} alt="badge" />
			</a>
		{/if}
	</div>
</div>
