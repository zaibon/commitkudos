import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';

import { CLAIM_PATH, redactClaimSecrets } from '#lib/claim.ts';
import { dev } from '$app/env';

Sentry.init({
	dsn: 'https://15841eeeac40ad075e756df391e51793@o4506180497899520.ingest.sentry.io/4506180501241856',
	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	// Replays record the page URL, which on the claim page holds the reward link's password.
	// Claim links are always opened with a full page load, so no replay runs there.
	integrations: window.location.pathname === CLAIM_PATH ? [] : [Sentry.replayIntegration()],
	beforeBreadcrumb: (breadcrumb) => redactClaimSecrets(breadcrumb),

	environment: dev ? 'development' : 'production'
});

// Reward links carry their password in the URL fragment: keep it out of every event sent to Sentry.
Sentry.addEventProcessor((event) => redactClaimSecrets(event));

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
