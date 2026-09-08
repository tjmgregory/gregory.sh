/**
 * Typed client for the newsroom lists API.
 *
 * Server only. The bearer token is a Pages secret and must never reach the
 * browser, so nothing under src/lib/components or a .svelte file may import
 * this module.
 *
 * The types come from src/lib/newsroom/types.ts, generated from the pinned
 * schema next to it. Do not hand-edit either: `bun run newsroom:check` fails
 * the build when they drift.
 */

import createClient from 'openapi-fetch';
import type { paths } from './types';

/** The public host. Override per environment with NEWSROOM_LISTS_URL. */
export const DEFAULT_LISTS_URL = 'https://the-newsroom-lists.crafts.software';

export type ListFields = Record<string, string | number | boolean>;

export type SubscribeResult =
	paths['/v1/lists/{list}/subscribe']['post']['responses'][200]['content']['application/json'];

export type UnsubscribeResult =
	paths['/v1/lists/{list}/unsubscribe']['post']['responses'][200]['content']['application/json'];

export type MemberResult =
	paths['/v1/lists/{list}/members/{email}']['get']['responses'][200]['content']['application/json'];

/**
 * Anything the API answered that was not a 2xx, plus the network failures that
 * never reached it. `status` is 0 when the request did not get an answer.
 */
export class NewsroomListsError extends Error {
	readonly status: number;
	readonly code: string;
	readonly detail: string;

	constructor(status: number, code: string, detail: string) {
		super(`newsroom lists ${status} ${code}: ${detail}`);
		this.name = 'NewsroomListsError';
		this.status = status;
		this.code = code;
		this.detail = detail;
	}
}

export interface ListsClientOptions {
	/** Defaults to DEFAULT_LISTS_URL. */
	baseUrl?: string;
	/** The site's bearer token, scoped to that site's lists. */
	token: string;
	/** Pass the request's fetch so the call joins the platform's request context. */
	fetch?: typeof globalThis.fetch;
}

interface Answer<T> {
	data?: T;
	error?: unknown;
	response: Response;
}

function unwrap<T>({ data, error, response }: Answer<T>): T {
	if (response.ok && data !== undefined) return data;
	const body = (error ?? {}) as { error?: string; detail?: string };
	throw new NewsroomListsError(
		response.status,
		body.error ?? 'unknown',
		body.detail ?? response.statusText ?? 'no detail'
	);
}

async function call<T>(run: () => Promise<Answer<T>>): Promise<T> {
	let answer: Answer<T>;
	try {
		answer = await run();
	} catch (cause) {
		throw new NewsroomListsError(
			0,
			'network',
			cause instanceof Error ? cause.message : 'request failed'
		);
	}
	return unwrap(answer);
}

export interface ListsClient {
	subscribe(
		list: string,
		email: string,
		fields?: ListFields
	): Promise<SubscribeResult>;
	unsubscribe(
		list: string,
		by: { email: string } | { token: string }
	): Promise<UnsubscribeResult>;
	member(list: string, email: string): Promise<MemberResult>;
}

export function createListsClient({
	baseUrl = DEFAULT_LISTS_URL,
	token,
	fetch
}: ListsClientOptions): ListsClient {
	const client = createClient<paths>({
		baseUrl,
		headers: { authorization: `Bearer ${token}` },
		...(fetch ? { fetch } : {})
	});

	return {
		subscribe(list, email, fields) {
			return call(() =>
				client.POST('/v1/lists/{list}/subscribe', {
					params: { path: { list } },
					body: fields ? { email, fields } : { email }
				})
			);
		},

		unsubscribe(list, by) {
			return call(() =>
				client.POST('/v1/lists/{list}/unsubscribe', {
					params: { path: { list } },
					body: by
				})
			);
		},

		member(list, email) {
			return call(() =>
				client.GET('/v1/lists/{list}/members/{email}', {
					params: { path: { list, email } }
				})
			);
		}
	};
}
