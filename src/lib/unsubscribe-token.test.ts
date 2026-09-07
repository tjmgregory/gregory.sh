import { describe, expect, it } from 'vitest';
import {
	createUnsubscribeToken,
	readTokenEmail,
	verifyUnsubscribeToken
} from './unsubscribe-token';

const secret = 'a'.repeat(64);
const venture = 'gregory_subscribers';

describe('unsubscribe token', () => {
	it('verifies a token it made and hands back the address', async () => {
		const token = await createUnsubscribeToken({
			email: '  Sam@Example.COM ',
			venture,
			secret
		});

		expect(await verifyUnsubscribeToken({ token, venture, secret })).toBe(
			'sam@example.com'
		);
	});

	it('reads the address out of the token without the secret', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture,
			secret
		});

		expect(readTokenEmail(token)).toBe('sam@example.com');
	});

	it('rejects a tampered signature', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture,
			secret
		});
		const [encodedEmail, signature] = token.split('.');
		const tampered = `${encodedEmail}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;

		expect(
			await verifyUnsubscribeToken({ token: tampered, venture, secret })
		).toBeNull();
	});

	it('rejects a token signed for another venture', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture: 'other_waitlist',
			secret
		});

		expect(await verifyUnsubscribeToken({ token, venture, secret })).toBeNull();
	});

	it('rejects a token signed with another secret', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture,
			secret: 'b'.repeat(64)
		});

		expect(await verifyUnsubscribeToken({ token, venture, secret })).toBeNull();
	});

	it('rejects a swapped address', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture,
			secret
		});
		const signature = token.split('.')[1];
		const swapped = `${btoa('mallory@example.com').replace(/=+$/, '')}.${signature}`;

		expect(
			await verifyUnsubscribeToken({ token: swapped, venture, secret })
		).toBeNull();
	});

	it('rejects malformed tokens', async () => {
		for (const token of ['', 'nodot', 'a.b.c', '.abc', 'abc.', '!!.??']) {
			expect(
				await verifyUnsubscribeToken({ token, venture, secret })
			).toBeNull();
			expect(readTokenEmail(token)).toBeNull();
		}
	});

	it('rejects every token when no secret is set', async () => {
		const token = await createUnsubscribeToken({
			email: 'sam@example.com',
			venture,
			secret
		});

		expect(
			await verifyUnsubscribeToken({ token, venture, secret: '' })
		).toBeNull();
	});
});
