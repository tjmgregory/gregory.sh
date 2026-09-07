import { cleanup, render } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/stores', () => ({
	page: readable({
		url: new URL('https://gregory.sh/unsubscribe?token=abc.def')
	})
}));

const { default: Page } = await import('./+page.svelte');

afterEach(cleanup);

describe('unsubscribe page with a token', () => {
	it('shows one line and a button that posts to the token URL', () => {
		const { getByText, container } = render(Page);

		getByText(/Unsubscribe this address from/);

		const form = container.querySelector('form');
		expect(form?.getAttribute('method')).toBe('POST');
		expect(form?.getAttribute('action')).toBe('/api/unsubscribe?token=abc.def');

		const button = getByText('Unsubscribe', { selector: 'button' });
		expect(button.closest('form')).toBe(form);
	});
});
