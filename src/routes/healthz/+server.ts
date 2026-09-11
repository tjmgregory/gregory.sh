import { healthDocument } from '$lib/health.server';

export async function GET({ platform }: { platform?: App.Platform }) {
	const version = platform?.env?.CF_PAGES_COMMIT_SHA || 'development';
	try {
		const response = await healthDocument(platform);
		return new Response(response.body, { status: response.status, headers: response.headers });
	} catch (error) {
		return Response.json({ status: 'fail', version, serviceId: 'gregory-sh-web', checks: { system: [{ componentType: 'system', status: 'fail', time: new Date().toISOString(), output: String(error) }] } }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}
}
