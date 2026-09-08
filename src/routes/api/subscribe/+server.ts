import { json } from '@sveltejs/kit';
import {
	listsClientFor,
	listsErrorResponse,
	readFields,
	UNAVAILABLE
} from '$lib/newsroom/lists.server';
import { site } from '$lib/newsroom/config';
import { verifyTurnstile } from '$lib/server/turnstile';
import { TURNSTILE_ACTIONS, TURNSTILE_HOSTNAMES } from '$lib/turnstile-config';
import { isValidEmail } from '$lib/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, fetch }) => {
	let body: { email?: string; fields?: unknown; turnstileToken?: unknown };
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
		action: TURNSTILE_ACTIONS.subscribe,
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
		await lists.subscribe(site.newsroomList, normalizedEmail, readFields(body.fields));
	} catch (error) {
		return listsErrorResponse(error);
	}

	// Same response shape for new and existing emails so the endpoint cannot be
	// used to enumerate subscriber membership.
	return json({ message: 'Subscribed successfully' });
};
