const destination = 'https://gregory.sh/blog/human-friendly-skill';

export function handleRequest(request: Request): Response {
	const url = new URL(request.url);
	if (url.hostname !== 'gregory.sh' || !['/z/test', '/z/test/'].includes(url.pathname)) {
		return new Response('Not found', { status: 404 });
	}

	if (!['GET', 'HEAD'].includes(request.method)) {
		return new Response('Method not allowed', {
			status: 405,
			headers: { Allow: 'GET, HEAD' }
		});
	}

	return Response.redirect(destination, 302);
}
