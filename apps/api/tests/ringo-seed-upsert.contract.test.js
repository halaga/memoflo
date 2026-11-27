import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("Ringo catalogue upsert avoids conflicting MongoDB update operators", async () => {
  const source = await readFile(path.join(root, "src/modules/business-service/businessService.seed.js"), "utf8");
  assert.match(source, /\{\s*\$set:\s*data\s*\}/);
  assert.doesNotMatch(source, /\$setOnInsert:\s*data/);
  assert.match(source, /slug:\s*\{\s*\$ne:\s*"it-support"\s*\}/);
});
test("Ringo catalogue includes IT Request and Data Subscription on IT Requisition", async () => {
  const source = await readFile(path.join(root, "src/modules/business-service/businessService.seed.js"), "utf8");
  for (const slug of ["it-request", "data-subscription"]) {
    const index = source.indexOf(`slug: "${slug}"`);
    assert.notEqual(index, -1, `${slug} must be seeded`);
    assert.match(source.slice(index, index + 600), /allowedRequisitionTypes:\s*\["IT Requisition"\]/);
  }
});
test("Ringo seed script reads its API .env and only needs MONGO_URI", async () => {
  const source = await readFile(path.join(root, "src/scripts/seed-ringo-pilot-config.js"), "utf8");
  assert.match(source, /dotenv\.config\(\{\s*path:/);
  assert.match(source, /process\.env\.MONGO_URI/);
  assert.doesNotMatch(source, /JWT_SECRET/);
});
