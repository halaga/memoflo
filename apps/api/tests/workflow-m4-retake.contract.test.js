import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("workflow stage edits are blocked while any request is running", async () => {
  const service = await read("src/modules/workflow/workflow.service.js");
  assert.match(service, /async assertNoRunningInstances/);
  assert.match(service, /status: \{ \$in: \["pending", "running"\] \}/);
  for (const method of ["addStep", "updateStep", "reorderStep", "reactivateStep", "deleteStep"]) {
    const start = service.indexOf(`async ${method}(`);
    assert.notEqual(start, -1, `Missing ${method}`);
    const next = service.indexOf("\n    async ", start + 10);
    const block = service.slice(start, next < 0 ? undefined : next);
    assert.match(block, /assertNoRunningInstances/, `${method} must protect active workflow instances`);
  }
});

test("workflow stage order can be changed through a tenant-scoped API", async () => {
  const routes = await read("src/modules/workflow/workflow.routes.js");
  const controller = await read("src/modules/workflow/workflow.controller.js");
  const service = await read("src/modules/workflow/workflow.service.js");
  const repository = await read("src/modules/workflow/workflow.repository.js");
  assert.match(routes, /:id\/steps\/:stepId\/reorder/);
  assert.match(routes, /authorize\("workflow.update"\)/);
  assert.match(controller, /WorkflowService\.reorderStep/);
  assert.match(service, /async reorderStep/);
  assert.match(repository, /async reorderSteps/);
  assert.match(repository, /temporary negative order/);
});

test("workflow administration supports activation and versioned definition edits", async () => {
  const ui = await read("../web/src/views/administration/WorkflowSettingsView.vue");
  const service = await read("src/modules/workflow/workflow.service.js");
  assert.match(ui, /toggleWorkflowStatus/);
  assert.match(ui, /Deactivate/);
  assert.match(ui, /Activate/);
  assert.match(ui, /moveStep/);
  assert.match(service, /\$inc: \{ version: 1 \}/);
  assert.match(service, /Reassign .* before deactivating this workflow/);
  assert.match(service, /Add at least one workflow stage before activating this workflow/);
  assert.doesNotMatch(service, /Reactivate this workflow before editing its stages/);
});

test("workflow delegation and reassignment are tenant-validated and audited", async () => {
  const engine = await read("src/modules/workflow/workflow.engine.js");
  const instance = await read("src/modules/workflow/workflowInstance.model.js");
  const routes = await read("src/modules/workflow/workflow.routes.js");
  assert.match(engine, /async delegate\(/);
  assert.match(engine, /async reassign\(/);
  assert.match(engine, /company: companyId,[\s\S]*employmentStatus: "Active"/);
  assert.match(engine, /currentStep\.allowDelegate/);
  assert.match(instance, /assignmentHistory/);
  assert.match(routes, /instances\/:instanceId\/delegate/);
  assert.match(routes, /instances\/:instanceId\/reassign/);
});

test("conditional service fields are validated only when visible", async () => {
  const web = await read("../web/src/views/memos/CreateMemoView.vue");
  const api = await read("src/modules/memo/memo.service.js");
  assert.match(web, /visibleServiceFields/);
  assert.match(web, /matchesFieldCondition/);
  assert.match(api, /isVisible\(field\)/);
  assert.match(api, /field\.conditionalOn/);
});

test("workflow start is idempotent for an existing resource and protected by a partial unique index", async () => {
  const engine = await read("src/modules/workflow/workflow.engine.js");
  const repository = await read("src/modules/workflow/workflow.repository.js");
  const model = await read("src/modules/workflow/workflowInstance.model.js");
  const migration = await read("src/scripts/migrate-workflow-active-index.js");
  assert.match(engine, /\["running", "pending", "completed"\]/);
  assert.match(engine, /error\?\.code === 11000/);
  assert.match(repository, /"completed"/);
  assert.match(model, /active_workflow_resource_unique/);
  assert.match(model, /workflowVersion/);
  assert.match(engine, /workflowVersion: workflow\.version \|\| 1/);
  assert.match(migration, /duplicate active workflow instances must be reviewed/);
});

test("workflow reassignment and delegation are exposed in the memo action panel", async () => {
  const actionBar = await read("../web/src/components/workflow/WorkflowActionBar.vue");
  const panel = await read("../web/src/components/workflow/WorkflowInstancePanel.vue");
  const detail = await read("../web/src/views/memos/MemoDetailView.vue");
  assert.match(actionBar, /emit\('delegate'/);
  assert.match(actionBar, /emit\('reassign'/);
  assert.match(actionBar, /instance\.currentStep\?\.allowDelegate/);
  assert.match(panel, /@delegate/);
  assert.match(panel, /@reassign/);
  assert.match(detail, /changeAssignment/);
  assert.match(detail, /@delegate="changeAssignment\('delegate', \$event\)"/);
  assert.match(detail, /@reassign="changeAssignment\('reassign', \$event\)"/);
  assert.match(detail, /@delegate="changeAssignment\('delegate', \$event\)"/);
  assert.match(detail, /@reassign="changeAssignment\('reassign', \$event\)"/);
});
