import { GITHUB_TOKEN } from '$app/env/private';

import type { CommitDetail } from '../types';

export async function listCommits(
	owner: string,
	name: string,
	since?: string
): Promise<CommitDetail[]> {
	const url = new URL(
		`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits`
	);
	url.searchParams.set('per_page', '100');
	if (since) {
		url.searchParams.set('since', since);
	}
	const resp = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {})
		}
	});

	if (resp.status == 404) {
		throw new Error(`repository ${owner}/${name} not found`);
	}

	if (resp.status != 200) {
		const text = await resp.text();
		throw new Error(`failed to fetch commits ${text}`);
	}
	return await resp.json();
}
