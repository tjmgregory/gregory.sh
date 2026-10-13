export const ideaGroups = [
	'Testing with real people',
	'Out in the world',
	'Waitlist open',
	'Early days'
] as const;

export interface Idea {
	name: string;
	group: (typeof ideaGroups)[number];
	description: string;
	meta: string;
	link?: { label: string; href: string };
}

export const ideas: readonly Idea[] = [
	{
		name: 'LetsIRL',
		group: 'Testing with real people',
		description:
			'Helps people at tech events find who’s worth meeting, and helps organisers find sponsors and spaces.',
		meta: 'Pilot running in San Francisco',
		link: { label: 'letsirl.com', href: 'https://letsirl.com' }
	},
	{
		name: 'CasualComp',
		group: 'Testing with real people',
		description:
			'Takes the admin out of social tournaments: the schedule, the court bookings, and who owes what.',
		meta: 'Tried at one padel event · Oct 2026'
	},
	{
		name: 'Lanteon',
		group: 'Out in the world',
		description: 'Screen time goals, seen by those who care about you.',
		meta: 'iPhone app · public beta on TestFlight',
		link: {
			label: 'Join the beta',
			href: 'https://testflight.apple.com/join/YWvVFWj6'
		}
	},
	{
		name: 'Deli Meet',
		group: 'Out in the world',
		description:
			'Themed backgrounds for Google Meet. The first shows what the meeting is costing.',
		meta: 'Chrome extension · Oct 2026 · made for fun',
		link: { label: 'delimeet.tv', href: 'https://delimeet.tv' }
	},
	{
		name: 'FlareClues',
		group: 'Waitlist open',
		description: 'The symptom tracker that calls you.',
		meta: 'Phone-call diary',
		link: { label: 'flareclues.com', href: 'https://flareclues.com' }
	},
	{
		name: 'Protect My Sim',
		group: 'Waitlist open',
		description: 'Stop overpaying for mobile.',
		meta: 'Plan switcher',
		link: { label: 'protectmysim.com', href: 'https://protectmysim.com' }
	},
	{
		name: 'Cognoscenti',
		group: 'Early days',
		description:
			'A short daily news podcast on the topics you choose, so you’re never caught out in conversation.',
		meta: 'I listen to my own version every day'
	},
	{
		name: 'Memreez',
		group: 'Early days',
		description:
			'Memoirs written by everyone who was there, woven into one story.',
		meta: 'Researching · since Apr 2026'
	},
	{
		name: 'Pengua',
		group: 'Early days',
		description:
			'Learn a language by reading real books. Pengua explains the grammar that trips you up, and checks it stuck.',
		meta: 'Researching · since May 2026'
	}
];

export const workTools = [
	{ name: 'Inc', slug: 'building-inc' },
	{ name: 'Minutes', slug: 'scrappy-personal-software' },
	{ name: 'Editable plans', slug: 'human-friendly-skill' }
] as const;
