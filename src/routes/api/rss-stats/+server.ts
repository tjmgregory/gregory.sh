import { json } from '@sveltejs/kit';
import { getRssStats } from '$lib/rss-stats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.RSS_STATS) {
		return json({ error: 'Stats unavailable' }, { status: 503 });
	}

	const stats = await getRssStats(platform.env.RSS_STATS);

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
