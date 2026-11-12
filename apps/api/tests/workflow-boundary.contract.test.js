import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(resolve(here, relativePath), "utf8");

const engine = read("../src/modules/workflow/workflow.engine.js");
const service = read("../src/modules/workflow/workflow.service.js");
const repository = read("../src/modules/workflow/workflow.repository.js");

test("workflow start rejects unsupported resources before creating an instance", () => {
  assert.match(engine, /normalizedResourceType !== "memo"/);
  assert.match(engine, /Unsupported workflow resource type/);
  assert.match(engine, /Workflow resource not found in this company/);
});

test("workflow actions require the current assigned employee", () => {
  assert.match(engine, /async authorizeCurrentEmployee\(instance, userId\)/);
  assert.match(engine, /String\(currentEmployeeId\) !== String\(userId\)/);
  assert.match(engine, /You are not authorized to perform this workflow action/);
});

test("workflow step mutations and reads retain company and workflow scope", () => {
  assert.match(service, /company: companyId,[\s\S]*workflow: workflowId/);
  assert.match(service, /safeWorkflowUpdates/);
  assert.match(service, /safeStepUpdates/);
  assert.match(repository, /findSteps\(companyId, workflowId\)/);
  assert.match(repository, /company: companyId/);
});
