import type { RequestHandler } from './$types';
import { listCommits } from '$lib/github';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const since = url.searchParams.get('since') ?? '';
	const repository = url.searchParams.get('repository') ?? '';

	if (!repository) {
		return json({ error: 'repository name is required' }, { status: 400 });
	}
	const [owner, name] = repository.split('/', 2);
	if (!owner || !name) {
		return json({ error: 'repository name format invalid' }, { status: 400 });
	}

	const commits = await listCommits(owner, name, since);
	return json(commits);
};
