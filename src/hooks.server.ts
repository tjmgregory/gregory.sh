import { type Handle, text } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { isCrossSiteFormPost } from './cross-site-forms';

export const handle: Handle = async ({ event, resolve }) => {
	if (!dev && isCrossSiteFormPost(event.request, event.url)) {
		return text(
			`Cross-site ${event.request.method} form submissions are forbidden`,
			{ status: 403 }
		);
	}

	return resolve(event);
};
