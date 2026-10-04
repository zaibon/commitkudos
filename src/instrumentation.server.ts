import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://15841eeeac40ad075e756df391e51793@o4506180497899520.ingest.sentry.io/4506180501241856',
	tracesSampleRate: 1.0,
	environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});
