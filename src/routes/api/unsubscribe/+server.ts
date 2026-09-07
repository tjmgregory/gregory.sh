import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyTurnstile } from '$lib/server/turnstile';
import { TURNSTILE_ACTIONS, TURNSTILE_HOSTNAMES } from '$lib/turnstile-config';
import { isValidEmail } from '$lib/validation';

const UNSUBSCRIBED = { message: 'Unsubscribed successfully' };
const UNAVAILABLE = { error: 'Service unavailable' };

// Matches the token exactly as the newsroom put it in the List-Unsubscribe
// URL. The site never decodes or verifies it, only checks this shape.
const TOKEN_PATTERN = /^[A-Za-z0-9_.-]{1,512}$/;

const REMOVING_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Unsubscribing | gregory.sh</title>
<meta name="robots" content="noindex">
</head>
<body>
<p>Your address is being removed from the gregory.sh mailing list.</p>
</body>
</html>`;

export const GET: RequestHandler = ({ url }) => {
	const token = url.searchParams.get('token');
	const location = token
		? `/unsubscribe?token=${encodeURIComponent(token)}`
		: '/unsubscribe';
	return new Response(null, { status: 303, headers: { location } });
};

async function readVia(request: Request): Promise<'one-click' | 'confirm'> {
	const body = await request.text();
	const params = new URLSearchParams(body);
	return params.get('List-Unsubscribe') === 'One-Click' ? 'one-click' : 'confirm';
}

export const POST: RequestHandler = async ({ request, url, platform }) => {
	// A mail client posting the List-Unsubscribe URL cannot solve a Turnstile
	// challenge. The site does not verify this token; it only records that
	// removal was requested. The newsroom verifies and deletes on its own sync.
	if (url.searchParams.has('token')) {
		const token = url.searchParams.get('token') ?? '';
		if (!TOKEN_PATTERN.test(token)) {
			return json({ error: 'Invalid unsubscribe link' }, { status: 400 });
		}

		if (!platform?.env?.SUBSCRIBERS) {
			console.error('KV namespace SUBSCRIBERS not available');
			return json(UNAVAILABLE, { status: 503 });
		}

		const via = await readVia(request);
		const marker = { requestedAt: new Date().toISOString(), via };

		await platform.env.SUBSCRIBERS.put(`unsub:${token}`, JSON.stringify(marker), {
			expirationTtl: 60 * 60 * 24 * 30
		});

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

	if (!platform?.env?.SUBSCRIBERS) {
		console.error('KV namespace SUBSCRIBERS not available');
		return json(UNAVAILABLE, { status: 503 });
	}

	const existing = await platform.env.SUBSCRIBERS.get(normalizedEmail);

	if (!existing) {
		// Don't reveal whether email was subscribed (privacy)
		return json(UNSUBSCRIBED);
	}

	await platform.env.SUBSCRIBERS.delete(normalizedEmail);

	return json(UNSUBSCRIBED);
};
