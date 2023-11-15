import { env } from '$env/dynamic/private';

import type { CommitDetail } from '../types';

export async function listCommits(
	owner: string,
	name: string,
	since?: string
): Promise<CommitDetail[]> {
	let url = `https://api.github.com/repos/${owner}/${name}/commits`;
	if (since) {
		url += `?since=${since}`;
	}
	const resp = await fetch(url, {
		headers: {
			Authorization: `bearer ${env.GITHUB_TOKEN}`
		}
	});
	return await resp.json();
}
