import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

import { dev } from '$app/environment';

Sentry.init({
	dsn: 'https://15841eeeac40ad075e756df391e51793@o4506180497899520.ingest.sentry.io/4506180501241856',
	tracesSampleRate: 1.0,
	environment: dev ? 'development' : 'production'
});

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle());

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
