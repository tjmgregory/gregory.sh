import { writable } from 'svelte/store';

// Tracks whether the intro animation has completed
export const introComplete = writable(true);

// Tracks whether the intro ran and just completed (for fade-in animation)
export const shouldAnimateFadeIn = writable(false);
