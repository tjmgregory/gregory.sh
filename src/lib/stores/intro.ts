import { writable } from 'svelte/store';

// Tracks whether the intro animation has completed
// Starts false so content is hidden until intro runs or navigation detected
export const introComplete = writable(false);

// Tracks whether the intro ran and just completed (for fade-in animation)
export const shouldAnimateFadeIn = writable(false);
