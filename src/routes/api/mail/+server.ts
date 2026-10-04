import { json } from '@sveltejs/kit';

import { sendMail } from '#lib/services/mail.ts';
import type { Email } from '#lib/types.ts';

import type { RequestHandler } from './$types';

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function isPeanutLink(link: string) {
	try {
		const url = new URL(link);
		return url.protocol === 'https:' && /(^|\.)peanut\.(to|me)$/.test(url.hostname);
	} catch {
		return false;
	}
}

function validate(email: Partial<Email>): string | undefined {
	if (!email.name || !email.email || !email.repoName || !email.link) {
		return 'name, email, repoName and link are required';
	}
	if (!EMAIL_RE.test(email.email)) {
		return 'invalid email address';
	}
	if (!/^[\w.-]+\/[\w.-]+$/.test(email.repoName)) {
		return 'invalid repository name';
	}
	if (!isPeanutLink(email.link)) {
		return 'link must be a peanut link';
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const email: Partial<Email> = await request.json().catch(() => ({}));
	const invalid = validate(email);
	if (invalid) {
		return json({ error: invalid }, { status: 400 });
	}

	try {
		await sendMail(email as Email);
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('failed to send email', error);
		return json({ error: (error as Error).message }, { status: 500 });
	}
};
