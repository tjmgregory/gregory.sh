/// <reference types="@cloudflare/workers-types" />

export interface ReaderStats {
	subscribers: number;
	lastSeen: string;
	userAgent: string;
}

export interface UnknownReaderStats {
	count: number;
	lastSeen: string;
}

export interface RssSubscriberData {
	readers: {
		feedly?: ReaderStats;
		inoreader?: ReaderStats;
		newsblur?: ReaderStats;
		feedbin?: ReaderStats;
		unknown?: UnknownReaderStats;
	};
	totalSubscribers: number;
	lastUpdated: string;
}

type KnownReader = 'feedly' | 'inoreader' | 'newsblur' | 'feedbin';

interface ParsedReader {
	type: KnownReader | 'unknown';
	subscribers: number | null;
}

const RSS_STATS_KEY = 'rss:subscribers';

/**
 * Parse User-Agent to identify feed reader and subscriber count
 */
export function parseUserAgent(userAgent: string): ParsedReader {
	const ua = userAgent.toLowerCase();

	// Feedly: "Feedly/1.0 (+http://www.feedly.com/; 42 subscribers; ...)"
	if (ua.includes('feedly')) {
		const match = userAgent.match(/(\d+)\s*subscribers/i);
		return {
			type: 'feedly',
			subscribers: match ? parseInt(match[1], 10) : null
		};
	}

	// Inoreader: "Inoreader/1.0 (+http://inoreader.com; 15 subscribers)"
	if (ua.includes('inoreader')) {
		const match = userAgent.match(/(\d+)\s*subscribers/i);
		return {
			type: 'inoreader',
			subscribers: match ? parseInt(match[1], 10) : null
		};
	}

	// NewsBlur: "NewsBlur Feed Finder - 3 subscribers"
	if (ua.includes('newsblur')) {
		const match = userAgent.match(/(\d+)\s*subscribers/i);
		return {
			type: 'newsblur',
			subscribers: match ? parseInt(match[1], 10) : null
		};
	}

	// Feedbin: "Feedbin feed-id:123456 - 2 subscribers"
	if (ua.includes('feedbin')) {
		const match = userAgent.match(/(\d+)\s*subscribers/i);
		return {
			type: 'feedbin',
			subscribers: match ? parseInt(match[1], 10) : null
		};
	}

	return { type: 'unknown', subscribers: null };
}

/**
 * Update RSS subscriber stats in KV
 */
export async function trackRssSubscriber(kv: KVNamespace, userAgent: string): Promise<void> {
	const parsed = parseUserAgent(userAgent);
	const now = new Date().toISOString();

	const existing = (await kv.get(RSS_STATS_KEY, 'json')) as RssSubscriberData | null;

	const data: RssSubscriberData = existing ?? {
		readers: {},
		totalSubscribers: 0,
		lastUpdated: now
	};

	if (parsed.type === 'unknown') {
		data.readers.unknown = {
			count: (data.readers.unknown?.count ?? 0) + 1,
			lastSeen: now
		};
	} else {
		data.readers[parsed.type] = {
			subscribers: parsed.subscribers ?? data.readers[parsed.type]?.subscribers ?? 0,
			lastSeen: now,
			userAgent: userAgent
		};
	}

	// Recalculate total from known readers
	data.totalSubscribers = Object.entries(data.readers)
		.filter(([key]) => key !== 'unknown')
		.reduce((sum, [, stats]) => {
			return sum + ((stats as ReaderStats).subscribers ?? 0);
		}, 0);

	data.lastUpdated = now;

	await kv.put(RSS_STATS_KEY, JSON.stringify(data));
}

/**
 * Get RSS subscriber stats from KV
 */
export async function getRssStats(kv: KVNamespace): Promise<RssSubscriberData | null> {
	return kv.get(RSS_STATS_KEY, 'json') as Promise<RssSubscriberData | null>;
}
