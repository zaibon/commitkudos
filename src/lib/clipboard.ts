import { toaster } from '#lib/toaster.ts';

export async function copyToClipboard(text: string, title = 'Copied to clipboard') {
	try {
		await navigator.clipboard.writeText(text);
		toaster.success({ title, duration: 1500 });
	} catch {
		toaster.error({ title: 'Could not access the clipboard' });
	}
}
