import { error } from '@sveltejs/kit';

import { getRepository } from '#lib/services/github.ts';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const repository = url.searchParams.get('repository') ?? '';
	const [owner, name] = repository.split('/', 2);
	if (!owner || !name) {
		return Response.json({ error: 'repository name format invalid' }, { status: 400 });
	}

	try {
		return Response.json(await getRepository(owner, name));
	} catch (err) {
		const message = (err as Error).message;
		console.log(message);
		error(message.includes('not found') ? 404 : 500, message);
	}
};
