/**
 * gregory.sh has no site.config.ts (that's a landing-template thing), so the
 * two newsroom lists settings live here instead.
 */

export const site = {
	/** Shown in the unsubscribe confirmation page title. */
	name: 'gregory.sh',

	/** The list this site writes to in the newsroom lists API. */
	newsroomList: 'gregory_subscribers'
};
