import { json } from '@sveltejs/kit';
import { observeDatastore } from '$lib/health.server';
import { getRssStats } from '$lib/rss-stats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.RSS_STATS) {
		return json({ error: 'Stats unavailable' }, { status: 503 });
	}

	let stats;
	try {
		stats = await observeDatastore(platform, 'rss-stats-get', () =>
			getRssStats(platform.env.RSS_STATS)
		);
	} catch {
		return json({ error: 'Stats unavailable' }, { status: 503 });
	}

	if (!stats) {
		return json({
			readers: {},
			totalSubscribers: 0,
			lastUpdated: null,
			message: 'No data collected yet'
		});
	}

	return json(stats);
};
