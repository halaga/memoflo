import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("IT Support remains a dedicated ticket center, not a memo service", async () => {
  const detail = await readFile(path.join(root, "../web/src/views/ServiceDetailView.vue"), "utf8");
  const action = await readFile(path.join(root, "../web/src/views/ServiceActionView.vue"), "utf8");
  assert.match(detail, /item\.slug === "it-support"/);
  assert.match(detail, /return `\/services\/it-support\/start`/);
  assert.match(action, /actionType = "it-support-center"/);
  assert.match(action, /IT Support is a ticketing workspace/);
  assert.match(action, /Log a new support ticket/);
  assert.match(action, /Try a quick solution first/);
});
test("IT Request and Data Subscription are tenant-seeded, not global built-ins", async () => {
  const detail = await readFile(path.join(root, "../web/src/views/ServiceDetailView.vue"), "utf8");
  const services = await readFile(path.join(root, "../web/src/views/ServicesView.vue"), "utf8");
  const seed = await readFile(path.join(root, "src/modules/business-service/businessService.seed.js"), "utf8");
  assert.doesNotMatch(detail, /"it-request"\s*:/);
  assert.doesNotMatch(services, /slug: "it-request"/);
  assert.match(seed, /slug: "it-request"/);
  assert.match(services, /visibleDynamic = dynamic\.filter\(\(service\) => service\.catalogueVisible !== false\)/);
  assert.match(seed, /catalogueVisible: entry\.category !== "IT" \|\| entry\.slug === "it-request"/);
  assert.match(seed, /catalogueVisible: false/);
  assert.match(seed, /actionType: "it-support-center", routeKey: "it-support-center"/);
  assert.match(seed, /Data Subscription/);
  assert.match(seed, /conditionalOn: "requestCategory", conditionalValue: "Data Subscription"/);
  assert.match(services, /catalogueVisible !== false/);
  assert.match(services, /IT Support & Maintenance/);
  assert.doesNotMatch(services, /name: "IT Request"/);

});
test("Topbar does not expose a Create Memo shortcut", async () => {
  const topbar = await readFile(path.join(root, "../web/src/components/layout/Topbar.vue"), "utf8");
  const template = topbar.split("<template>")[1]?.split("</template>")[0] || "";
  const styles = topbar.split("<style")[1] || "";
  assert.doesNotMatch(template, /topbar-create-memo|Create Memo/);
  assert.doesNotMatch(styles, /topbar-create-memo/);
});

test("Approval Memo composer does not offer hidden grouped IT child services", async () => {
  const composer = await readFile(path.join(root, "../web/src/views/memos/CreateMemoView.vue"), "utf8");
  assert.match(composer, /catalogueVisible !== false/);
  assert.match(composer, /visibleServiceFields/);
});

test("Approval Memo workflow starts automatically; detail page has no manual start action", async () => {
  const detail = await readFile(path.join(root, "../web/src/views/memos/MemoDetailView.vue"), "utf8");
  const memoService = await readFile(path.join(root, "src/modules/memo/memo.service.js"), "utf8");
  assert.doesNotMatch(detail, /Start Approval Workflow|startWorkflow\(/);
  assert.match(memoService, /WorkflowEngine\.start\(companyId, workflowId, "memo", memo\._id, actorId\)/);
});
