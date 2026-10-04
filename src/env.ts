import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	GITHUB_TOKEN: {
		description: 'GitHub token used to list repository commits (optional, avoids rate limits)',
		schema: optional
	},
	SMTP_HOST: { description: 'SMTP server used to send reward emails', schema: optional },
	SMTP_PORT: {
		description: 'SMTP server port',
		schema: (value) => (value ? parseInt(value) : 587)
	},
	SMTP_USER: { description: 'SMTP username', schema: optional },
	SMTP_PASSWORD: { description: 'SMTP password', schema: optional }
});
