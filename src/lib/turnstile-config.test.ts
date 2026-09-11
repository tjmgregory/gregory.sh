import { describe, expect, it } from 'vitest';
import { TURNSTILE_SITE_KEY, TURNSTILE_TEST_SITE_KEY, turnstileSiteKey } from './turnstile-config';

describe('Turnstile site key', () => {
	it('uses the test key on Pages previews', () => {
		expect(turnstileSiteKey('branch.gregory-sh.pages.dev')).toBe(TURNSTILE_TEST_SITE_KEY);
	});

	it('keeps the production key on the public site', () => {
		expect(turnstileSiteKey('gregory.sh')).toBe(TURNSTILE_SITE_KEY);
	});
});
