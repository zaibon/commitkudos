import { type MessageHeaders, SMTPClient } from 'emailjs';

import { SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from '$app/env/private';

import type { Email } from '../types';

let client: SMTPClient | undefined;

function getClient() {
	if (!SMTP_HOST) {
		throw new Error('SMTP_HOST is not configured');
	}
	client ??= new SMTPClient({
		user: SMTP_USER,
		password: SMTP_PASSWORD,
		host: SMTP_HOST,
		port: SMTP_PORT,
		tls: true
	});
	return client;
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function buildText(email: Email) {
	return `Hello ${email.name},

Thanks for your contribution to https://github.com/${email.repoName}

Follow this link to receive your reward: ${email.link}`;
}

function buildHtml(email: Email) {
	const name = escapeHtml(email.name);
	const repo = escapeHtml(email.repoName);
	const link = escapeHtml(email.link);
	return `<p>Hello ${name},</p>
	<p>Thanks for your contribution to <a href="https://github.com/${repo}">${repo}</a></p>
	<p>Follow this link to receive your reward: <a href="${link}">${link}</a></p>`;
}

export async function sendMail(email: Email): Promise<MessageHeaders> {
	const message = await getClient().sendAsync({
		text: buildText(email),
		from: 'CommitKudos <reward@commitkudos.com>',
		to: `${email.name} <${email.email}>`,
		subject: `You received kudos for your contribution to ${email.repoName}`,
		attachment: [{ data: buildHtml(email), alternative: true }]
	});
	return message as MessageHeaders;
}
