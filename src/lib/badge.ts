import type { Badge, BadgeStyle } from '#lib/types.ts';

const baseURL = 'https://img.shields.io/badge';

export const badgeStyles: { value: BadgeStyle; label: string }[] = [
	{ value: 'flat', label: 'Flat' },
	{ value: 'flat-square', label: 'Flat square' },
	{ value: 'plastic', label: 'Plastic' },
	{ value: 'for-the-badge', label: 'Big' },
	{ value: 'social', label: 'Social' }
];

// shields.io static badge path segments use `-` as separator: escape `-` and `_` as `--` and `__`
function escapeSegment(value: string) {
	return encodeURIComponent(value.replaceAll('-', '--').replaceAll('_', '__'));
}

/** shields.io image URL of the badge, or undefined while the content or the color is missing */
export function badgeImageURL(badge: Badge): string | undefined {
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

/** CommitKudos URL the badge links to, with the repository prefilled */
export function badgeLink(repository: string, reward = 1): string {
	const u = new URL('https://commitkudos.com');
	u.searchParams.set('repository', repository);
	u.searchParams.set('contributor', '5');
	u.searchParams.set('reward', reward.toString());
	return u.toString();
}
