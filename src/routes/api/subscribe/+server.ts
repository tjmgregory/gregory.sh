import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyTurnstile } from '$lib/server/turnstile';
import { TURNSTILE_ACTIONS, TURNSTILE_HOSTNAMES } from '$lib/turnstile-config';
import { isValidEmail } from '$lib/validation';

export const POST: RequestHandler = async ({ request, platform }) => {
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
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const verified = await verifyTurnstile({
		token: turnstileToken,
		secret: turnstileSecret,
		action: TURNSTILE_ACTIONS.subscribe,
		allowedHostnames: TURNSTILE_HOSTNAMES,
		remoteIp: request.headers.get('CF-Connecting-IP')
	});
	if (!verified) {
		return json({ error: 'Verification failed. Please try again.' }, { status: 400 });
	}

	if (!platform?.env?.SUBSCRIBERS) {
		console.error('KV namespace SUBSCRIBERS not available');
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	// Same response shape for new and existing emails so the endpoint cannot be
	// used to enumerate subscriber membership.
	const existing = await platform.env.SUBSCRIBERS.get(normalizedEmail);
	if (!existing) {
		await platform.env.SUBSCRIBERS.put(normalizedEmail, JSON.stringify({
			subscribedAt: new Date().toISOString()
		}));
	}

	return json({ message: 'Subscribed successfully' });
};
