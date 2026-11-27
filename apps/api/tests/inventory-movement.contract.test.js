import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("inventory movement model and API are tenant-scoped", async () => {
  const model = await readFile(path.join(root, "src/modules/inventory/inventoryMovement.model.js"), "utf8");
  const routes = await readFile(path.join(root, "src/modules/inventory/inventory.routes.js"), "utf8");
  assert.match(model, /company:\s*\{[^}]*required:\s*true/s);
  assert.match(model, /company:\s*1,\s*item:\s*1/);
  assert.match(routes, /router\.get\("\/movements"/);
  assert.match(routes, /router\.post\("\/movements"/);
});
test("stock movements are recorded in a transaction and do not follow purchase approval automatically", async () => {
  const service = await readFile(path.join(root, "src/modules/inventory/inventory.service.js"), "utf8");
  assert.match(service, /session\.withTransaction/);
  assert.match(service, /Goods Receipt/);
  assert.match(service, /Stock Transfer/);
  assert.match(service, /Stock Adjustment/);
  assert.match(service, /Only .* available to issue/);
  assert.match(service, /approved purchase request/);
  assert.match(service, /approved Approval Memo/);
  assert.match(service, /memoType:\s*"approval"/);
});
