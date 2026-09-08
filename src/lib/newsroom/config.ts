/**
 * gregory.sh has no site.config.ts (that's a landing-template thing), so the
 * two newsroom lists settings live here instead.
 */

export const site = {
	/** Shown in the unsubscribe confirmation page title. */
	name: 'gregory.sh',

	/** The list this site writes to in the newsroom lists API. */
	newsroomList: 'gregory_subscribers',

	/**
	 * Whether a signup or an unsubscribe is also written to the SUBSCRIBERS KV
	 * namespace. The newsroom lists API is the record; KV is the old store,
	 * kept in step during cutover. Off as of 2026-09-08: the final audience
	 * sync has run and the SUBSCRIBERS namespace awaits deletion.
	 */
	kvWrites: false as boolean
};
