import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Allow serving from main repo (for worktree node_modules access)
			allow: ['content', '../..']
		}
	}
});
