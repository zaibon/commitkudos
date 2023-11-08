import { env } from '$env/dynamic/private';
import type { Email } from './types';
import { SMTPClient, type Message } from 'emailjs';

const client = new SMTPClient({
	user: env.SMTP_USER,
	password: env.SMTP_PASSWORD,
	host: env.SMTP_HOST,
	port: parseInt(env.SMTP_PORT ?? '587'),
	tls: true
});

function buildTemplate(email: Email) {
	return `<p>Hello ${email.name},</p>
		<p>Thanks for you contribution to <a href="https://github.com/${email.repoName}">${email.repoName}</a></p>
	<p>Follow this link to receive your reward: <a href=${email.link}>${email.link}</p>`;
}

// send the message and get a callback with an error or details of the message that was sent
export async function sendMail(email: Email): Promise<Message> {
	const message = await client.sendAsync({
		text: 'i hope this works',
		from: 'reward@commitkudos.com',
		to: `${email.name} <${email.email}>`,
		subject: 'testing',
		attachment: [{ data: buildTemplate(email), alternative: true }]
	});
	return message;
}
