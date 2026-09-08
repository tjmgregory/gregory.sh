/**
 * What the routes need on top of the generated client: build it from the
 * platform env, and turn a failure into the answer the browser should see.
 *
 * Server only, same as client.server.ts.
 */

import { json } from '@sveltejs/kit';
import {
	createListsClient,
	DEFAULT_LISTS_URL,
	type ListFields,
	type ListsClient,
	NewsroomListsError
} from './client.server';

export const UNAVAILABLE = { error: 'Service unavailable' };

interface ListsEnv {
	NEWSROOM_LISTS_TOKEN?: string;
	NEWSROOM_LISTS_URL?: string;
}

// One line per worker instance, not one per signup, so a missing secret is
// visible in the logs without drowning them.
let warnedAboutToken = false;

/**
 * Null when the site has no token. The caller answers 503: a site that cannot
 * reach the list is misconfigured, and the visitor can do nothing about it.
 */
export function listsClientFor(
	env: ListsEnv | undefined,
	fetch?: typeof globalThis.fetch
): ListsClient | null {
	const token = env?.NEWSROOM_LISTS_TOKEN;
	if (!token) {
		if (!warnedAboutToken) {
			warnedAboutToken = true;
			console.error(
				'NEWSROOM_LISTS_TOKEN is not set. Signups cannot reach the newsroom lists API.'
			);
		}
		return null;
	}
	return createListsClient({
		baseUrl: env?.NEWSROOM_LISTS_URL || DEFAULT_LISTS_URL,
		token,
		fetch
	});
}

/**
 * 400 is the only failure the visitor caused, so its detail goes back as-is.
 * Everything else (a bad token, the wrong list, the list gone, the API down,
 * the network) is ours to fix and reads as unavailable.
 */
export function listsErrorResponse(error: unknown): Response {
	if (error instanceof NewsroomListsError) {
		if (error.status === 400) {
			return json({ error: error.detail }, { status: 400 });
		}
		console.error(error.message);
	} else {
		console.error('newsroom lists call failed', error);
	}
	return json(UNAVAILABLE, { status: 503 });
}

/** Signup extras are free-form per list, so keep the primitives and drop the rest. */
export function readFields(value: unknown): ListFields | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}
	const fields: ListFields = {};
	for (const [key, entry] of Object.entries(value)) {
		if (
			typeof entry === 'string' ||
			typeof entry === 'number' ||
			typeof entry === 'boolean'
		) {
			fields[key] = entry;
		}
	}
	return Object.keys(fields).length > 0 ? fields : undefined;
}
