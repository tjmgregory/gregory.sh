import { createHealthState } from '$lib/health-state.server';
import { hasValidTurnstileInput, verifyTurnstileResult, type VerifyTurnstileOptions } from '$lib/server/turnstile';
import { NewsroomListsError } from '$lib/newsroom/client.server';

const health = createHealthState({
	serviceId: 'gregory-sh-web',
	operations: [
		{ operation: 'rss-stats-get', kind: 'datastore', componentId: 'rss-stats', cadenceSeconds: null },
		{ operation: 'rss-stats-put', kind: 'datastore', componentId: 'rss-stats', cadenceSeconds: null },
		{ operation: 'lists-subscribe', kind: 'dependency', componentId: 'the-newsroom-lists', cadenceSeconds: 300 },
		{ operation: 'lists-unsubscribe', kind: 'dependency', componentId: 'the-newsroom-lists', cadenceSeconds: 300 },
		{ operation: 'turnstile-verify', kind: 'dependency', componentId: 'turnstile', cadenceSeconds: 300 }
	]
});

export function observeDatastore<T>(platform: App.Platform | undefined, operation: 'rss-stats-get' | 'rss-stats-put', run: () => Promise<T>) {
	return health.observe(platform, operation, run);
}

export async function observeDependency<T>(platform: App.Platform | undefined, operation: 'lists-subscribe' | 'lists-unsubscribe' | 'turnstile-verify', run: () => Promise<T>) {
	return health.observe(platform, operation, run, (error) => error instanceof NewsroomListsError && error.status === 400);
}

export async function observeTurnstile(platform: App.Platform | undefined, input: VerifyTurnstileOptions) {
	if (!hasValidTurnstileInput(input)) return false;
	let result = { accepted: false, available: false, attempted: true };
	try {
		await health.observe(platform, 'turnstile-verify', async () => {
			result = await verifyTurnstileResult(input);
			if (!result.available) throw new Error('Turnstile unavailable');
			return result;
		});
		return result.accepted;
	} catch {
		return false;
	}
}

export async function healthDocument(platform: App.Platform | undefined) {
	if (!platform?.env?.RSS_STATS) throw new Error('RSS_STATS binding unavailable');
	if (!platform?.env?.HEALTH_STATE) throw new Error('HEALTH_STATE binding unavailable');
	if (!platform?.env?.TURNSTILE_SECRET_KEY) throw new Error('TURNSTILE_SECRET_KEY unavailable');
	if (!platform?.env?.NEWSROOM_LISTS_TOKEN) throw new Error('NEWSROOM_LISTS_TOKEN unavailable');
	return health.read(platform);
}
