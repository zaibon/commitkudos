import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: false,
			// sourceMapsUploadOptions: {
			// 	org: 'zaibon',
			// 	project: 'commitkudos',
			// },
			adapter: 'vercel'
		}),
		sveltekit(),
		purgeCss()
	]
});
