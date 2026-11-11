import { error } from '@sveltejs/kit';
import { loadPostPage, POSTS_CACHE_CONTROL, renderPost, summaryOf, usesAssets } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
	const { post, posts } = await loadPostPage(platform, params.slug);
	if (!post) error(404, 'Post not found');

	setHeaders({ 'cache-control': POSTS_CACHE_CONTROL });
	return {
		post: summaryOf(post),
		html: await renderPost(post),
		usesAssets: usesAssets(post),
		morePosts: posts.filter((other) => other.slug !== post.slug).slice(0, 2)
	};
};
