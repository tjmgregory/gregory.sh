import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidEmail } from '$lib/validation';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { email } = (await request.json()) as { email?: string };

	if (!email || !isValidEmail(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const normalizedEmail = email.toLowerCase().trim();

	if (!platform?.env?.SUBSCRIBERS) {
		console.error('KV namespace SUBSCRIBERS not available');
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const existing = await platform.env.SUBSCRIBERS.get(normalizedEmail);

	if (!existing) {
		// Don't reveal whether email was subscribed (privacy)
		return json({ message: 'Unsubscribed successfully' });
	}

	await platform.env.SUBSCRIBERS.delete(normalizedEmail);

	return json({ message: 'Unsubscribed successfully' });
};
