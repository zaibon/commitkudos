import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: false,
			adapter: 'vercel'
		}),
		tailwindcss(),
		sveltekit({
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
			compilerOptions: {
				runes: true
			}
		})
	]
});
