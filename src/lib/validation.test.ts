import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation';

describe('isValidEmail', () => {
	it('accepts valid emails', () => {
		expect(isValidEmail('test@example.com')).toBe(true);
		expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
		expect(isValidEmail('user+tag@example.org')).toBe(true);
	});

	it('rejects emails without @', () => {
		expect(isValidEmail('invalid')).toBe(false);
		expect(isValidEmail('invalid.com')).toBe(false);
	});

	it('rejects emails without domain', () => {
		expect(isValidEmail('user@')).toBe(false);
		expect(isValidEmail('@domain.com')).toBe(false);
	});

	it('rejects emails with spaces', () => {
		expect(isValidEmail('user @example.com')).toBe(false);
		expect(isValidEmail('user@ example.com')).toBe(false);
		expect(isValidEmail(' user@example.com')).toBe(false);
	});

	it('rejects empty string', () => {
		expect(isValidEmail('')).toBe(false);
	});
});
