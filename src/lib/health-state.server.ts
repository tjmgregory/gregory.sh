export interface HealthOperation {
	operation: string;
	kind: 'datastore' | 'dependency';
	componentId: string;
	cadenceSeconds: number | null;
}

export interface HealthConfig {
	serviceId: string;
	operations: readonly HealthOperation[];
}

type HealthPlatform = App.Platform | undefined;

function environment(platform: HealthPlatform) {
	const value = platform?.env.HEALTH_ENVIRONMENT;
	if (value !== 'local' && value !== 'preview' && value !== 'production') {
		throw new Error('HEALTH_ENVIRONMENT must be local, preview, or production');
	}
	return value;
}

function state(platform: HealthPlatform, config: HealthConfig) {
	const value = environment(platform);
	if (!platform) throw new Error('platform bindings unavailable');
	return platform.env.HEALTH_STATE.getByName(`${config.serviceId}:${value}`);
}

function normalizedError(error: unknown) {
	const value =
		error instanceof Error
			? error.message
			: String(error || 'operation failed');
	return (
		Array.from(value, (character) => {
			const code = character.charCodeAt(0);
			return code < 32 || code === 127 ? ' ' : character;
		})
			.join('')
			.trim()
			.slice(0, 240) || 'operation failed'
	);
}

async function register(platform: HealthPlatform, config: HealthConfig) {
	const value = environment(platform);
	const response = await state(platform, config).fetch(
		'https://health/v1/register',
		{
			method: 'POST',
			body: JSON.stringify({
				version: 1,
				serviceId: config.serviceId,
				environment: value,
				operations: config.operations
			}),
			signal: AbortSignal.timeout(10_000)
		}
	);
	if (!response.ok)
		throw new Error(`health registration returned HTTP ${response.status}`);
}

async function record(
	platform: HealthPlatform,
	config: HealthConfig,
	metadata: HealthOperation,
	outcome: 'success' | 'failure',
	observedAt: string,
	error: string | null
) {
	const value = environment(platform);
	await register(platform, config);
	const response = await state(platform, config).fetch(
		'https://health/v1/observations',
		{
			method: 'POST',
			body: JSON.stringify({
				version: 1,
				serviceId: config.serviceId,
				environment: value,
				operation: metadata.operation,
				kind: metadata.kind,
				componentId: metadata.componentId,
				outcome,
				observedAt,
				error,
				cadenceSeconds: metadata.cadenceSeconds
			}),
			signal: AbortSignal.timeout(10_000)
		}
	);
	if (!response.ok)
		throw new Error(`health recorder returned HTTP ${response.status}`);
}

function defer(platform: HealthPlatform, promise: Promise<unknown>) {
	const task = promise.catch((error) =>
		console.error(`Health observation failed: ${error}`)
	);
	platform?.context?.waitUntil(task);
}

export function createHealthState(config: HealthConfig) {
	async function observe<T>(
		platform: HealthPlatform,
		operation: string,
		run: () => Promise<T>,
		expectedFailure: (error: unknown) => boolean = () => false
	) {
		const metadata = config.operations.find(
			(entry) => entry.operation === operation
		);
		if (!metadata) throw new Error(`unknown health operation: ${operation}`);
		const observedAt = new Date().toISOString();
		try {
			const result = await run();
			defer(
				platform,
				record(platform, config, metadata, 'success', observedAt, null)
			);
			return result;
		} catch (error) {
			const expected = expectedFailure(error);
			defer(
				platform,
				record(
					platform,
					config,
					metadata,
					expected ? 'success' : 'failure',
					observedAt,
					expected ? null : normalizedError(error)
				)
			);
			throw error;
		}
	}

	async function read(platform: HealthPlatform) {
		const value = environment(platform);
		const version = platform?.env.CF_PAGES_COMMIT_SHA || 'development';
		await register(platform, config);
		return state(platform, config).fetch(
			`https://health/v1/health?serviceId=${config.serviceId}&environment=${value}&version=${encodeURIComponent(version)}&observedAt=${encodeURIComponent(new Date().toISOString())}`,
			{ signal: AbortSignal.timeout(10_000) }
		);
	}

	return { observe, read };
}
