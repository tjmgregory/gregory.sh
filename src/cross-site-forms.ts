const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain'
];

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function isFormBody(request: Request): boolean {
	const type = request.headers
		.get('content-type')
		?.split(';', 1)[0]
		.trim()
		.toLowerCase();
	return !!type && FORM_CONTENT_TYPES.includes(type);
}

/**
 * The one URL a mail client posts to. It sends no origin and cannot be given
 * one. Nothing on the site verifies the token itself; the newsroom checks it
 * on its own sync, so this route only ever writes a marker, never a deletion.
 */
function isOneClickUnsubscribe(url: URL): boolean {
	return url.pathname === '/api/unsubscribe' && url.searchParams.has('token');
}

/**
 * What SvelteKit's own origin check does, minus the one-click unsubscribe URL.
 * `csrf.trustedOrigins` in svelte.config.js turns the built-in check off
 * because it cannot be waived for a single route.
 */
export function isCrossSiteFormPost(request: Request, url: URL): boolean {
	return (
		UNSAFE_METHODS.includes(request.method) &&
		isFormBody(request) &&
		request.headers.get('origin') !== url.origin &&
		!isOneClickUnsubscribe(url)
	);
}
