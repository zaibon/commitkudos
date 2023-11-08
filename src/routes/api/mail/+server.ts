import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMail } from '$lib/mail';

export const POST: RequestHandler = async ({ request }) => {
	const email = await request.json();
	try {
		await sendMail(email);
		return json({ sucess: true }, { status: 200 });
	} catch (error) {
		return json({ error: error }, { status: 500 });
	}
};
