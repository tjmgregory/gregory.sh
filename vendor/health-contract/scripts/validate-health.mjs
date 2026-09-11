#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { stdin } from "node:process";
import { validateHealthDocument } from "../health/validate-v1.mjs";

const args = process.argv.slice(2);
let httpStatus;
let file = "-";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--http-status") httpStatus = Number(args[++i]);
  else if (file === "-") file = args[i];
  else throw new Error(`unexpected argument: ${args[i]}`);
}

let raw;
if (file === "-") {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  raw = Buffer.concat(chunks).toString("utf8");
} else {
  raw = await readFile(file, "utf8");
}

let document;
try {
  document = JSON.parse(raw);
} catch (error) {
  console.error(`health body is not JSON: ${error.message}`);
  process.exit(1);
}
const result = validateHealthDocument(document, { httpStatus });
if (!result.valid) {
  for (const error of result.errors) console.error(`health contract: ${error}`);
  process.exit(1);
}
