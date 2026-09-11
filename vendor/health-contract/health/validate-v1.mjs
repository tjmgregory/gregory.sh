import validateStructure from "./validate-structure-v1.mjs";

const rank = { pass: 0, warn: 1, fail: 2 };

function isoMillis(value) {
  if (value === null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute, second, offsetHour = "00", offsetMinute = "00"] = match;
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (Number(day) < 1 || Number(day) > daysInMonth || Number(hour) > 23 || Number(minute) > 59 ||
      Number(second) > 59 || Number(offsetHour) > 23 || Number(offsetMinute) > 59) return Number.NaN;
  return Date.parse(value);
}

function entries(document) {
  return Object.entries(document.checks).flatMap(([checkName, checks]) =>
    checks.map((check) => ({ checkName, check })),
  );
}

function producerDependencyStatus(check, produced, success) {
  if (check.lastError === null) return "pass";
  if (check.lastSuccessAt === null) return "fail";
  return (produced - success) / 1000 <= check.cadenceSeconds * 2 ? "warn" : "fail";
}

export function evaluateDependencyChecks(document, { observedAt = new Date().toISOString() } = {}) {
  const now = isoMillis(observedAt);
  return entries(document)
    .filter(({ check }) => check.componentType === "dependency")
    .map(({ checkName, check }) => {
      const lastSuccess = isoMillis(check.lastSuccessAt);
      const successAgeSeconds = lastSuccess === null ? null : Math.max(0, (now - lastSuccess) / 1000);
      let status = "pass";
      if (check.lastError !== null) {
        status = successAgeSeconds !== null && successAgeSeconds <= check.cadenceSeconds * 2 ? "warn" : "fail";
      }
      return {
        checkName,
        componentId: check.componentId,
        status,
        cadenceSeconds: check.cadenceSeconds,
        lastAttemptAt: check.lastAttemptAt,
        lastSuccessAt: check.lastSuccessAt,
        lastError: check.lastError,
        successAgeSeconds,
      };
    });
}

export function validateHealthDocument(document, { httpStatus, observedAt = new Date().toISOString() } = {}) {
  const errors = [];
  if (!validateStructure(document)) {
    for (const error of validateStructure.errors ?? []) {
      errors.push(`${error.instancePath || "/"} ${error.message}`);
    }
    return { valid: false, errors };
  }

  const observedMillis = isoMillis(observedAt);
  if (!Number.isFinite(observedMillis)) errors.push("observedAt must be an RFC 3339 timestamp");

  const local = entries(document).filter(({ check }) => check.componentType !== "dependency");
  const expectedRoot = local.reduce(
    (status, { check }) => (rank[check.status] > rank[status] ? check.status : status),
    "pass",
  );
  if (document.status !== expectedRoot) {
    errors.push(`status must be ${expectedRoot}; dependency checks do not roll up`);
  }

  if (httpStatus !== undefined) {
    const expectedHttp = document.status === "fail" ? 503 : 200;
    if (Number(httpStatus) !== expectedHttp) errors.push(`HTTP status must be ${expectedHttp} for ${document.status}`);
  }

  for (const { checkName, check } of entries(document)) {
    const checkIndex = document.checks[checkName].indexOf(check);
    const where = `checks.${checkName}[${checkIndex}]`;
    if (check.time !== undefined && !Number.isFinite(isoMillis(check.time))) {
      errors.push(`${where}.time must be a real RFC 3339 timestamp`);
    }
    if (check.componentType !== "dependency") continue;
    const attempt = isoMillis(check.lastAttemptAt);
    const success = isoMillis(check.lastSuccessAt);
    const produced = isoMillis(check.time);

    if (attempt !== null && !Number.isFinite(attempt)) errors.push(`${where}.lastAttemptAt must be a real RFC 3339 timestamp`);
    if (success !== null && !Number.isFinite(success)) errors.push(`${where}.lastSuccessAt must be a real RFC 3339 timestamp`);

    if (attempt === null && (success !== null || check.lastError !== null || check.observedValue !== null)) {
      errors.push(`${where} never-attempted state must have null success, error, and observedValue`);
    }
    if (attempt !== null && attempt > produced) errors.push(`${where}.lastAttemptAt must not be after time`);
    if (success !== null && success > produced) errors.push(`${where}.lastSuccessAt must not be after time`);
    if (success !== null && attempt !== null && success > attempt) errors.push(`${where}.lastSuccessAt must not be after lastAttemptAt`);
    if (Number.isFinite(observedMillis) && produced > observedMillis + 1000) errors.push(`${where}.time must not be in the future`);

    if (success === null && check.observedValue !== null) {
      errors.push(`${where}.observedValue must be null without a last success`);
    } else if (success !== null) {
      const expectedAge = Math.max(0, (produced - success) / 1000);
      if (check.observedValue === null || Math.abs(check.observedValue - expectedAge) > 1) {
        errors.push(`${where}.observedValue must be the last-success age at time`);
      }
    }

    if (check.lastError === null && attempt !== null && success === null) {
      errors.push(`${where} an attempted success needs lastSuccessAt`);
    }
    if (check.lastError === null && attempt !== null && success !== null && Math.abs(attempt - success) > 1000) {
      errors.push(`${where} latest successful attempt must equal lastSuccessAt`);
    }
    if (check.lastError !== null && attempt === null) errors.push(`${where} an error needs lastAttemptAt`);
    if (check.lastError !== null && success !== null && attempt < success) {
      errors.push(`${where} a failed attempt must not predate lastSuccessAt`);
    }

    const expected = producerDependencyStatus(check, produced, success);
    if (check.status !== expected) errors.push(`${where}.status must be ${expected} for its recorded call state`);
  }

  return { valid: errors.length === 0, errors };
}
