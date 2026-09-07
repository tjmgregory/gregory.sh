import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyTurnstile } from '$lib/server/turnstile';
import { TURNSTILE_ACTIONS, TURNSTILE_HOSTNAMES } from '$lib/turnstile-config';
import { UNSUBSCRIBE_AUDIENCE } from '$lib/unsubscribe-config';
import { verifyUnsubscribeToken } from '$lib/unsubscribe-token';
import { isValidEmail } from '$lib/validation';

const UNSUBSCRIBED = { message: 'Unsubscribed successfully' };

export const GET: RequestHandler = ({ url }) => {
	const token = url.searchParams.get('token');
	redirect(
		303,
		token ? `/unsubscribe?token=${encodeURIComponent(token)}` : '/unsubscribe'
	);
};

export const POST: RequestHandler = async ({ request, url, platform }) => {
	const token = url.searchParams.get('token');

	// A mail client posting the List-Unsubscribe URL cannot solve a Turnstile
	// challenge. The signature is what stands in for it.
	if (token) {
		const secret = platform?.env?.UNSUBSCRIBE_SECRET;
		if (!secret) {
			console.error('UNSUBSCRIBE_SECRET not available');
			return json({ error: 'Service unavailable' }, { status: 503 });
		}

		const signedEmail = await verifyUnsubscribeToken({
			token,
			venture: UNSUBSCRIBE_AUDIENCE,
			secret
		});
		if (!signedEmail) {
			return json({ error: 'Invalid unsubscribe link' }, { status: 400 });
		}

		if (!platform?.env?.SUBSCRIBERS) {
			console.error('KV namespace SUBSCRIBERS not available');
			return json({ error: 'Service unavailable' }, { status: 503 });
		}

		await platform.env.SUBSCRIBERS.delete(signedEmail);

		return json(UNSUBSCRIBED);
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
		return json({ error: 'Service unavailable' }, { status: 503 });
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
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const existing = await platform.env.SUBSCRIBERS.get(normalizedEmail);

	if (!existing) {
		// Don't reveal whether email was subscribed (privacy)
		return json(UNSUBSCRIBED);
	}

	await platform.env.SUBSCRIBERS.delete(normalizedEmail);

	return json(UNSUBSCRIBED);
};
