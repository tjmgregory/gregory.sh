export function GET() {
	return new Response('live\n', { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
