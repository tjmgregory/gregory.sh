import { DurableObject } from "cloudflare:workers";
import { validateHealthDocument } from "@the-software-engineer/unikraft-deploy-health/health";

type Kind = "datastore" | "dependency";
type Outcome = "success" | "failure";

interface Observation {
	version: 1;
	serviceId: string;
	environment: string;
	operation: string;
	kind: Kind;
	componentId: string;
	outcome: Outcome;
	observedAt: string;
	error: string | null;
	cadenceSeconds: number | null;
}

interface OperationState {
	operation: string;
	kind: Kind;
	componentId: string;
	cadenceSeconds: number | null;
	lastAttemptAt: string | null;
	lastSuccessAt: string | null;
	lastError: string | null;
}

const fields = ["version", "serviceId", "environment", "operation", "kind", "componentId", "outcome", "observedAt", "error", "cadenceSeconds"].sort();
const serviceIdPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const internalIdPattern = /^[a-z0-9](?:[a-z0-9:._-]{0,126}[a-z0-9])?$/;

function contractTimestamp(value: string): boolean {
	return validateHealthDocument({ status: "pass", version: "protocol", serviceId: "health-state", checks: { timestamp: [{ componentType: "system", status: "pass", time: value }] } }, { observedAt: new Date().toISOString() }).valid;
}

function parseObservation(value: unknown): Observation | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const input = value as Record<string, unknown>;
	if (Object.keys(input).sort().join("\0") !== fields.join("\0")) return null;
	if (input.version !== 1 || typeof input.serviceId !== "string" || !serviceIdPattern.test(input.serviceId)) return null;
	if (typeof input.environment !== "string" || !internalIdPattern.test(input.environment)) return null;
	if (typeof input.operation !== "string" || !internalIdPattern.test(input.operation)) return null;
	if ((input.kind !== "datastore" && input.kind !== "dependency") || typeof input.componentId !== "string" || input.componentId.length === 0) return null;
	if (input.kind === "dependency" && !serviceIdPattern.test(input.componentId)) return null;
	if (input.outcome !== "success" && input.outcome !== "failure") return null;
	if (typeof input.observedAt !== "string" || !contractTimestamp(input.observedAt) || Date.parse(input.observedAt) > Date.now()) return null;
	if (input.outcome === "success" ? input.error !== null : typeof input.error !== "string" || input.error.length === 0) return null;
	if (input.kind === "dependency" ? !Number.isInteger(input.cadenceSeconds) || Number(input.cadenceSeconds) <= 0 : input.cadenceSeconds !== null) return null;
	const candidate = input.kind === "dependency"
		? { componentType: "dependency", componentId: input.componentId, status: input.outcome === "success" ? "pass" : "fail", time: input.observedAt, cadenceSeconds: input.cadenceSeconds, lastAttemptAt: input.observedAt, lastSuccessAt: input.outcome === "success" ? input.observedAt : null, lastError: input.error, observedValue: input.outcome === "success" ? 0 : null, observedUnit: "s" }
		: { componentType: "datastore", componentId: input.componentId, status: input.outcome === "success" ? "pass" : "fail", time: input.observedAt, ...(input.error === null ? {} : { output: input.error }) };
	if (!validateHealthDocument({ status: input.kind === "datastore" && input.outcome === "failure" ? "fail" : "pass", version: "protocol", serviceId: input.serviceId, checks: { candidate: [candidate] } }, { httpStatus: input.kind === "datastore" && input.outcome === "failure" ? 503 : 200 }).valid) return null;
	return input as unknown as Observation;
}

export class HealthState extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (request.method === "POST" && url.pathname === "/v1/register") {
			let input: { version?: unknown; serviceId?: unknown; environment?: unknown; operations?: unknown } = {};
			try { input = await request.json(); } catch {}
			if (input.version !== 1 || typeof input.serviceId !== "string" || typeof input.environment !== "string" || !Array.isArray(input.operations)) return new Response("invalid registration\n", { status: 400 });
			for (const value of input.operations) {
				if (!value || typeof value !== "object") return new Response("invalid registration\n", { status: 400 });
				const policy = value as Record<string, unknown>;
				const observation = { version: 1, serviceId: input.serviceId, environment: input.environment, operation: policy.operation, kind: policy.kind, componentId: policy.componentId, outcome: "success", observedAt: "1970-01-01T00:00:00.000Z", error: null, cadenceSeconds: policy.cadenceSeconds } as unknown as Observation;
				if (!parseObservation(observation)) return new Response("invalid registration\n", { status: 400 });
				const response = await this.register(observation);
				if (!response.ok) return response;
			}
			return new Response("registered\n", { status: 200 });
		}
		if (request.method === "POST" && url.pathname === "/v1/observations") {
			let observation: Observation | null = null;
			try { observation = parseObservation(await request.json()); } catch {}
			if (!observation) return new Response("invalid observation\n", { status: 400 });
			return this.record(observation);
		}
		if (request.method === "GET" && url.pathname === "/v1/health") return this.health(url);
		return new Response("not found\n", { status: 404 });
	}

	private async register(observation: Observation): Promise<Response> {
		const identity = await this.ctx.storage.get<{ serviceId: string; environment: string }>("identity");
		const nextIdentity = { serviceId: observation.serviceId, environment: observation.environment };
		if (identity && (identity.serviceId !== observation.serviceId || identity.environment !== observation.environment)) return new Response("object identity mismatch\n", { status: 409 });
		const key = `operation:${observation.operation}`;
		const existing = await this.ctx.storage.get<OperationState>(key);
		if (existing && (existing.kind !== observation.kind || existing.componentId !== observation.componentId || existing.cadenceSeconds !== observation.cadenceSeconds)) return new Response("operation policy mismatch\n", { status: 409 });
		if (!existing) {
			const operations = (await this.ctx.storage.get<string[]>("operations")) ?? [];
			await this.ctx.storage.put({ identity: identity ?? nextIdentity, [key]: { operation: observation.operation, kind: observation.kind, componentId: observation.componentId, cadenceSeconds: observation.cadenceSeconds, lastAttemptAt: null, lastSuccessAt: null, lastError: null }, operations: [...operations, observation.operation] });
		}
		return new Response("registered\n", { status: 200 });
	}

	private async record(observation: Observation): Promise<Response> {
		const identity = await this.ctx.storage.get<{ serviceId: string; environment: string }>("identity");
		const nextIdentity = { serviceId: observation.serviceId, environment: observation.environment };
		if (identity && (identity.serviceId !== observation.serviceId || identity.environment !== observation.environment)) return new Response("object identity mismatch\n", { status: 409 });
		const key = `operation:${observation.operation}`;
		const existing = await this.ctx.storage.get<OperationState>(key);
		if (existing && (existing.kind !== observation.kind || existing.componentId !== observation.componentId || existing.cadenceSeconds !== observation.cadenceSeconds)) return new Response("operation policy mismatch\n", { status: 409 });
		if (existing?.lastAttemptAt && Date.parse(observation.observedAt) <= Date.parse(existing.lastAttemptAt)) {
			if (observation.outcome === "success" && (existing.lastSuccessAt === null || Date.parse(observation.observedAt) > Date.parse(existing.lastSuccessAt))) existing.lastSuccessAt = observation.observedAt;
			if (Date.parse(observation.observedAt) === Date.parse(existing.lastAttemptAt) && observation.outcome === "failure") existing.lastError = observation.error;
			await this.ctx.storage.put(key, existing);
			return new Response("merged older observation\n", { status: 202 });
		}
		const state: OperationState = {
			operation: observation.operation,
			kind: observation.kind,
			componentId: observation.componentId,
			cadenceSeconds: observation.cadenceSeconds,
			lastAttemptAt: observation.observedAt,
			lastSuccessAt: observation.outcome === "success" ? observation.observedAt : existing?.lastSuccessAt ?? null,
			lastError: observation.outcome === "failure" ? observation.error : null,
		};
		const operations = (await this.ctx.storage.get<string[]>("operations")) ?? [];
		await this.ctx.storage.put({ identity: identity ?? nextIdentity, [key]: state, operations: operations.includes(observation.operation) ? operations : [...operations, observation.operation] });
		return new Response("recorded\n", { status: 201 });
	}

	private async health(url: URL): Promise<Response> {
		const serviceId = url.searchParams.get("serviceId");
		const environment = url.searchParams.get("environment");
		const version = url.searchParams.get("version");
		if (!serviceId || !serviceIdPattern.test(serviceId) || !environment || !internalIdPattern.test(environment) || !version || !validateHealthDocument({ status: "pass", version, serviceId, checks: {} }, { httpStatus: 200 }).valid) return new Response("invalid health request\n", { status: 400 });
		const identity = await this.ctx.storage.get<{ serviceId: string; environment: string }>("identity");
		if (identity && (identity.serviceId !== serviceId || identity.environment !== environment)) return new Response("object identity mismatch\n", { status: 409 });
		const operations = (await this.ctx.storage.get<string[]>("operations")) ?? [];
		const states = await Promise.all(operations.map((operation) => this.ctx.storage.get<OperationState>(`operation:${operation}`)));
		const observedAt = new Date().toISOString();
		const checks: Record<string, unknown[]> = {};
		let rootStatus: "pass" | "fail" = "pass";
		for (let index = 0; index < operations.length; index += 1) {
			const operation = operations[index];
			const state = states[index];
			if (!state) continue;
			if (state.kind === "datastore") {
				const status = state.lastError === null ? "pass" : "fail";
				if (status === "fail") rootStatus = "fail";
				checks[operation] = [{ componentType: "datastore", componentId: state.componentId, status, time: observedAt, ...(state.lastError === null ? {} : { output: state.lastError }) }];
				continue;
			}
			const age = state.lastSuccessAt === null ? null : (Date.parse(observedAt) - Date.parse(state.lastSuccessAt)) / 1000;
			if (Date.parse(state.lastAttemptAt ?? observedAt) > Date.parse(observedAt) || (age !== null && age < 0)) return new Response("health time precedes observations\n", { status: 400 });
			const status = state.lastError === null ? "pass" : age !== null && age <= 2 * Number(state.cadenceSeconds) ? "warn" : "fail";
			checks[operation] = [{ componentType: "dependency", componentId: state.componentId, status, time: observedAt, cadenceSeconds: state.cadenceSeconds, lastAttemptAt: state.lastAttemptAt, lastSuccessAt: state.lastSuccessAt, lastError: state.lastError, observedValue: age === null ? null : Math.floor(age), observedUnit: "s" }];
		}
		return Response.json({ status: rootStatus, version, serviceId, checks }, { status: rootStatus === "fail" ? 503 : 200 });
	}
}
