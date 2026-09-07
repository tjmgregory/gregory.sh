const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
		return Uint8Array.from(binary, (char) => char.charCodeAt(0));
	} catch {
		return null;
	}
}

function split(
	token: string
): { encodedEmail: string; signature: string } | null {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [encodedEmail, signature] = parts;
	if (!encodedEmail || !signature) return null;
	return { encodedEmail, signature };
}

function sameString(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let i = 0; i < a.length; i++) {
		difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return difference === 0;
}

async function sign(
	secret: string,
	venture: string,
	email: string
): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(`${venture}:${email}`)
	);
	return toBase64Url(new Uint8Array(signature));
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function createUnsubscribeToken(options: {
	email: string;
	venture: string;
	secret: string;
}): Promise<string> {
	const email = normalizeEmail(options.email);
	const signature = await sign(options.secret, options.venture, email);
	return `${toBase64Url(encoder.encode(email))}.${signature}`;
}

/** The address the token carries, unverified. For showing it in the browser. */
export function readTokenEmail(token: string): string | null {
	const parts = split(token);
	if (!parts) return null;
	const bytes = fromBase64Url(parts.encodedEmail);
	if (!bytes) return null;
	try {
		return decoder.decode(bytes);
	} catch {
		return null;
	}
}

export async function verifyUnsubscribeToken(options: {
	token: string;
	venture: string;
	secret: string;
}): Promise<string | null> {
	const parts = split(options.token);
	if (!parts || !options.secret) return null;
	const email = readTokenEmail(options.token);
	if (!email || email !== normalizeEmail(email)) return null;
	const expected = await sign(options.secret, options.venture, email);
	return sameString(parts.signature, expected) ? email : null;
}
