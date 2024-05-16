import { error, json } from '@sveltejs/kit';

import { listCommits } from '$lib/services/github';

import type { RequestHandler } from './$types';

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

	try {
		const commits = await listCommits(owner, name, since);
		return json(commits);
	} catch (err) {
		console.log((err as Error).message);
		error(500, err as Error);
	}
};
