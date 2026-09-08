#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const checksumIndex = args.indexOf("--manifest-sha256");
let expectedManifest = null;
if (checksumIndex !== -1) {
  expectedManifest = args[checksumIndex + 1];
  if (!/^[0-9a-f]{64}$/.test(expectedManifest ?? "")) {
    console.error("--manifest-sha256 needs one lowercase SHA-256 value");
    process.exit(1);
  }
  args.splice(checksumIndex, 2);
}
if (args.length > 1) {
  console.error("verify-health-vendor accepts one vendor root");
  process.exit(1);
}
const root = resolve(args[0] ?? ".");
const manifestPath = resolve(root, "health/vendor-manifest-v1.json");
const manifestBytes = await readFile(manifestPath);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

if (expectedManifest && digest(manifestBytes) !== expectedManifest) {
  console.error("health vendor manifest checksum does not match the consumer pin");
  process.exit(1);
}

const manifest = JSON.parse(manifestBytes);
let failed = false;
for (const [file, expected] of Object.entries(manifest.files)) {
  let actual;
  try {
    actual = digest(await readFile(resolve(root, file)));
  } catch {
    console.error(`health vendor file is missing: ${file}`);
    failed = true;
    continue;
  }
  if (actual !== expected) {
    console.error(`health vendor checksum mismatch: ${file}`);
    failed = true;
  }
}
if (failed) process.exit(1);
