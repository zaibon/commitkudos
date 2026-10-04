import type { RepoInfo } from '#lib/types.ts';

export type RepoResult =
	{ status: 'ok'; repo: RepoInfo } | { status: 'not-found' } | { status: 'error'; message: string };

/**
 * Accepts `owner/name` as well as a pasted GitHub URL (`https://github.com/owner/name.git`)
 * and returns `owner/name`.
 */
export function normalizeRepository(input: string): string {
	return input
		.trim()
		.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
		.replace(/\.git$/, '')
		.split('/')
		.slice(0, 2)
		.join('/');
}

export function isRepositoryName(repository: string): boolean {
	const [owner, name] = repository.split('/', 2);
	return !!owner && !!name;
}

export async function loadRepository(repository: string): Promise<RepoResult> {
	try {
		const resp = await fetch(`/api/github/repo?${new URLSearchParams({ repository })}`);
		if (resp.status === 404) {
			return { status: 'not-found' };
		}
		if (!resp.ok) {
			return { status: 'error', message: `GitHub answered with status ${resp.status}` };
		}
		return { status: 'ok', repo: await resp.json() };
	} catch (err) {
		return { status: 'error', message: (err as Error).message };
	}
}
