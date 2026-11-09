import { loadPostList, POSTS_CACHE_CONTROL } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	const posts = await loadPostList(platform);
	setHeaders({ 'cache-control': POSTS_CACHE_CONTROL });
	return { posts };
};
