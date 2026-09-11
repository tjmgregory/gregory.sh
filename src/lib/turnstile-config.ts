export const TURNSTILE_SITE_KEY = '0x4AAAAAAEXYmjtvHEz5qgum';
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export function turnstileSiteKey(hostname: string, productionSiteKey = TURNSTILE_SITE_KEY) {
	return hostname.endsWith('.pages.dev') ? TURNSTILE_TEST_SITE_KEY : productionSiteKey;
}

export const TURNSTILE_ACTIONS = {
	subscribe: 'newsletter_subscribe',
	unsubscribe: 'newsletter_unsubscribe'
} as const;
