// import { env } from '$env/dynamic/private';
import emailjs from '@emailjs/browser';

export async function sendMail(name, email, repoName, link) {
	let data = {
		service_id: 'service_38y1bph',
		template_id: 'template_le3yohr',
		user_id: 'gIypGyouYkPNLooPl',
		template_params: {
			email: email,
			from_name: 'rewarder',
			to_name: name,
			repo_name: repoName,
			link: link
		}
	};
	await emailjs.send(data.service_id, data.template_id, data.template_params, data.user_id);
}
