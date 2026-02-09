import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidEmail } from '$lib/validation';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { email } = await request.json();

	if (!email || !isValidEmail(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const normalizedEmail = email.toLowerCase().trim();

	if (!platform?.env?.SUBSCRIBERS) {
		console.error('KV namespace SUBSCRIBERS not available');
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const existing = await platform.env.SUBSCRIBERS.get(normalizedEmail);
	if (existing) {
		return json({ message: 'Already subscribed' });
	}

	await platform.env.SUBSCRIBERS.put(normalizedEmail, JSON.stringify({
		subscribedAt: new Date().toISOString()
	}));

	return json({ message: 'Subscribed successfully' });
};
