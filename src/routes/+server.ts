import type { RequestHandler } from './$types';
import { listCommits } from '$lib/github';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const since = url.searchParams.get('since') ?? '';
	const repository = url.searchParams.get('repository') ?? '';

	if (!repository) {
		return;
	}
	const [owner, name] = repository.split('/', 2);
	if (!owner || !name) {
		return;
	}

	const commits = await listCommits(owner, name, since);
	return json(commits);
};
