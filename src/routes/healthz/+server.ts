import { healthDocument } from '$lib/health.server';

export async function GET({ platform }: { platform?: App.Platform }) {
	try {
		const response = await healthDocument(platform);
		return new Response(response.body, { status: response.status, headers: response.headers });
	} catch (error) {
		return Response.json({ status: 'fail', version: 'unknown', serviceId: 'gregory-sh-web', checks: { system: [{ componentType: 'system', status: 'fail', time: new Date().toISOString(), output: String(error) }] } }, { status: 503 });
	}
}
