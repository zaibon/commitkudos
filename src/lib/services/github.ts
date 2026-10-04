import { GITHUB_TOKEN } from '$app/env/private';

import type { CommitDetail, RepoInfo } from '../types';

async function githubGet(url: URL | string): Promise<Response> {
	return fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {})
		}
	});
}

const repoURL = (owner: string, name: string) =>
	`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

export async function listCommits(
	owner: string,
	name: string,
	since?: string
): Promise<CommitDetail[]> {
	const url = new URL(`${repoURL(owner, name)}/commits`);
	url.searchParams.set('per_page', '100');
	if (since) {
		url.searchParams.set('since', since);
	}
	const resp = await githubGet(url);

	if (resp.status == 404) {
		throw new Error(`repository ${owner}/${name} not found`);
	}

	if (resp.status != 200) {
		const text = await resp.text();
		throw new Error(`failed to fetch commits ${text}`);
	}
	return await resp.json();
}

export async function getRepository(owner: string, name: string): Promise<RepoInfo> {
	const resp = await githubGet(repoURL(owner, name));

	if (resp.status == 404) {
		throw new Error(`repository ${owner}/${name} not found`);
	}

	if (resp.status != 200) {
		const text = await resp.text();
		throw new Error(`failed to fetch repository ${text}`);
	}
	const repo = await resp.json();
	return {
		fullName: repo.full_name,
		description: repo.description ?? '',
		avatarUrl: repo.owner?.avatar_url ?? '',
		htmlUrl: repo.html_url,
		stars: repo.stargazers_count ?? 0,
		forks: repo.forks_count ?? 0
	};
}
