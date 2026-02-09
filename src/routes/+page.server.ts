import { getPosts } from '$lib/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const posts = getPosts();
	return { posts };
};
