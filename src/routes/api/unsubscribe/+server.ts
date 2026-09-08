import { json } from '@sveltejs/kit';
import {
	listsClientFor,
	listsErrorResponse,
	UNAVAILABLE
} from '$lib/newsroom/lists.server';
import { site } from '$lib/newsroom/config';
import { verifyTurnstile } from '$lib/server/turnstile';
import { TURNSTILE_ACTIONS, TURNSTILE_HOSTNAMES } from '$lib/turnstile-config';
import { isValidEmail } from '$lib/validation';
import type { RequestHandler } from './$types';

const UNSUBSCRIBED = { message: 'Unsubscribed successfully' };

// Matches the token exactly as the newsroom put it in the List-Unsubscribe
// URL. The site never decodes it, only checks this shape before handing it
// to the newsroom, which is what verifies it.
const TOKEN_PATTERN = /^[A-Za-z0-9_.-]{1,512}$/;

const REMOVING_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Unsubscribing | ${site.name}</title>
<meta name="robots" content="noindex">
</head>
<body>
<p>Your address is being removed from the ${site.name} mailing list.</p>
</body>
</html>`;

export const GET: RequestHandler = ({ url }) => {
	const token = url.searchParams.get('token');
	const location = token
		? `/unsubscribe?token=${encodeURIComponent(token)}`
		: '/unsubscribe';
	return new Response(null, { status: 303, headers: { location } });
};

export const POST: RequestHandler = async ({ request, url, platform, fetch }) => {
	// A mail client posting the List-Unsubscribe URL cannot solve a Turnstile
	// challenge, so this path carries none. The newsroom verifies the token.
	if (url.searchParams.has('token')) {
		const token = url.searchParams.get('token') ?? '';
		if (!TOKEN_PATTERN.test(token)) {
			return json({ error: 'Invalid unsubscribe link' }, { status: 400 });
		}

		const lists = listsClientFor(platform?.env, fetch);
		if (!lists) {
			return json(UNAVAILABLE, { status: 503 });
		}

		try {
			await lists.unsubscribe(site.newsroomList, { token });
		} catch (error) {
			return listsErrorResponse(error);
		}

		return new Response(REMOVING_PAGE, {
			status: 200,
			headers: { 'content-type': 'text/html; charset=utf-8' }
		});
	}

	let body: { email?: string; turnstileToken?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const { email, turnstileToken } = body;

	if (!email || !isValidEmail(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const normalizedEmail = email.toLowerCase().trim();
	const turnstileSecret = platform?.env?.TURNSTILE_SECRET_KEY;
	if (!turnstileSecret) {
		console.error('TURNSTILE_SECRET_KEY not available');
		return json(UNAVAILABLE, { status: 503 });
	}

	const verified = await verifyTurnstile({
		token: turnstileToken,
		secret: turnstileSecret,
		action: TURNSTILE_ACTIONS.unsubscribe,
		allowedHostnames: TURNSTILE_HOSTNAMES,
		remoteIp: request.headers.get('CF-Connecting-IP')
	});
	if (!verified) {
		return json({ error: 'Verification failed. Please try again.' }, { status: 400 });
	}

	const lists = listsClientFor(platform?.env, fetch);
	if (!lists) {
		return json(UNAVAILABLE, { status: 503 });
	}

	try {
		await lists.unsubscribe(site.newsroomList, { email: normalizedEmail });
	} catch (error) {
		return listsErrorResponse(error);
	}

	// Don't reveal whether the address was subscribed (privacy).
	return json(UNSUBSCRIBED);
};
