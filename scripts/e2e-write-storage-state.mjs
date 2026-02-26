import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const outputPath = process.argv[2];
const envName = process.argv[3];

if (!outputPath || !envName) {
  console.error("Usage: node scripts/e2e-write-storage-state.mjs <outputPath> <envVarName>");
  process.exit(1);
}

const source = process.env[envName];
if (!source) {
  console.error(`Environment variable ${envName} is empty or missing.`);
  process.exit(1);
}

const parseState = (raw) => {
  const normalized = raw.trim();
  if (normalized.startsWith("{")) {
    return JSON.parse(normalized);
  }

  const decoded = Buffer.from(normalized, "base64").toString("utf-8");
  return JSON.parse(decoded);
};

const main = async () => {
  const parsed = parseState(source);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(parsed, null, 2), "utf-8");
  process.stdout.write(`Storage state written to ${outputPath}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
