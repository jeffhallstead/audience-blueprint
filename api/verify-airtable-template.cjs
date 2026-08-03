#!/usr/bin/env node
/**
 * verify-airtable-template.js
 *
 * Compares the live Airtable base schema against api/airtable-template.json
 * and prints a report of mismatches. Requires the Airtable connection to be
 * linked to the project (LOVABLE_API_KEY and AIRTABLE_API_KEY env vars).
 *
 * Usage:
 *   node api/verify-airtable-template.js [baseId]
 *
 * If baseId is omitted, the script looks for a base whose name contains
 * "Publisher Blueprint".
 */

const fs = require("fs");
const path = require("path");

const GATEWAY_URL = "https://connector-gateway.lovable.dev/airtable";
const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
const AIRTABLE_API_KEY = process.env["AIRTABLE_API_KEY"];

const templatePath = path.join(__dirname, "airtable-template.json");

async function gateway(path, init = {}) {
  const url = `${GATEWAY_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": AIRTABLE_API_KEY,
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Gateway request failed [${response.status}]: ${await response.text()}`);
  }
  return response.json();
}

async function findBlueprintBase() {
  const { bases } = await gateway("/v0/meta/bases");
  return bases.find((b) => /Publisher Blueprint/i.test(b.name));
}

function normalizeType(field) {
  // Airtable returns "singleLineText" but our schema uses the same names.
  return field.type;
}

function compareTable(liveTable, specTable) {
  const issues = [];
  const specFields = new Map(specTable.fields.map((f) => [f.name, f]));
  const liveFields = new Map(liveTable.fields.map((f) => [f.name, f]));

  for (const [name, spec] of specFields) {
    if (!liveFields.has(name)) {
      issues.push(`Missing field: ${name}`);
      continue;
    }
    const live = liveFields.get(name);
    if (normalizeType(live) !== spec.airtable_type) {
      issues.push(
        `Field type mismatch for "${name}": expected ${spec.airtable_type}, got ${normalizeType(live)}`,
      );
    }
  }

  for (const [name] of liveFields) {
    if (!specFields.has(name)) {
      issues.push(`Extra field not in template: ${name}`);
    }
  }

  return issues;
}

async function main() {
  if (!LOVABLE_API_KEY || !AIRTABLE_API_KEY) {
    console.error("LOVABLE_API_KEY and AIRTABLE_API_KEY must be set.");
    process.exit(1);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, "utf-8"));
  const baseId = process.argv[2] || (await findBlueprintBase())?.id;

  if (!baseId) {
    console.error("No Airtable base found with a name matching 'Publisher Blueprint'.");
    console.error("Create a new base from the template or pass the baseId as an argument.");
    process.exit(1);
  }

  const { tables } = await gateway(`/v0/meta/bases/${baseId}/tables`);
  const liveTables = new Map(tables.map((t) => [t.name, t]));

  let allClear = true;
  for (const specTable of template.tables) {
    console.log(`\nChecking table: ${specTable.name}`);
    const liveTable = liveTables.get(specTable.name);
    if (!liveTable) {
      console.log(`  ❌ Table missing: ${specTable.name}`);
      allClear = false;
      continue;
    }
    const issues = compareTable(liveTable, specTable);
    if (issues.length === 0) {
      console.log(`  ✅ All fields match`);
    } else {
      allClear = false;
      for (const issue of issues) {
        console.log(`  ❌ ${issue}`);
      }
    }
  }

  console.log("\n" + (allClear ? "✅ Template matches the live base." : "⚠️  Template does not match. See issues above."));
  process.exit(allClear ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
