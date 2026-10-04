import { json } from '@sveltejs/kit';

import { CLAIM_PATH } from '#lib/claim.ts';
import { sendMail } from '#lib/services/mail.ts';
import type { Email } from '#lib/types.ts';

import type { RequestHandler } from './$types';

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Only links to this site's claim page are emailed. */
function isClaimLink(link: string, origin: string) {
	try {
		const url = new URL(link);
		return url.origin === origin && url.pathname === CLAIM_PATH && url.hash.startsWith('#p=');
	} catch {
		return false;
	}
}

function validate(email: Partial<Email>, origin: string): string | undefined {
	if (!email.name || !email.email || !email.repoName || !email.link) {
		return 'name, email, repoName and link are required';
	}
	if (!EMAIL_RE.test(email.email)) {
		return 'invalid email address';
	}
	if (!/^[\w.-]+\/[\w.-]+$/.test(email.repoName)) {
		return 'invalid repository name';
	}
	if (!isClaimLink(email.link, origin)) {
		return 'link must be a CommitKudos claim link';
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	const email: Partial<Email> = await request.json().catch(() => ({}));
	const invalid = validate(email, url.origin);
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
