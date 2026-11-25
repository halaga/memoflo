import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowSeed = await readFile(path.resolve(here, "../src/modules/workflow/ringo.workflow.seed.js"), "utf8");
const serviceSeed = await readFile(path.resolve(here, "../src/modules/business-service/businessService.seed.js"), "utf8");
const workflowService = await readFile(path.resolve(here, "../src/modules/workflow/workflow.service.js"), "utf8");

test("Ringo workflow configuration is explicitly tenant-scoped", () => {
  assert.match(workflowSeed, /company\?\.code\s*\|\|\s*""\)\.toUpperCase\(\)\s*!==\s*"RINGO"/);
  assert.match(serviceSeed, /company\?\.code\s*\|\|\s*""\)\.toUpperCase\(\)\s*!==\s*"RINGO"/);
});

test("Ringo Admin, SBU and IT approval stages match the supplied routes", () => {
  const requiredStages = [
    "Admin Initiation",
    "TSM Authorization",
    "Head of SBU Authorization",
    "IC&C Vetting",
    "CEO Final Approval",
    "IT Initiation",
    "Admin Authorization",
  ];
  for (const stage of requiredStages) assert.ok(workflowSeed.includes(stage), `Missing stage: ${stage}`);
  assert.match(workflowSeed, /"Admin Requisition"/);
  assert.match(workflowSeed, /"SBU Requisition"/);
  assert.match(workflowSeed, /"IT Requisition"/);
  assert.match(workflowSeed, /RINGO-TSM/);
});

test("Head of SBU approval resolves dynamically from the memo Beneficiary SBU", async () => {
  const engine = await readFile(path.resolve(here, "../src/modules/workflow/workflow.engine.js"), "utf8");
  const stepModel = await readFile(path.resolve(here, "../src/modules/workflow/workflowStep.model.js"), "utf8");
  const memoService = await readFile(path.resolve(here, "../src/modules/memo/memo.service.js"), "utf8");
  assert.match(workflowSeed, /RINGO-HEAD-SBU-\$\{sbu\.code\}/);
  assert.match(workflowSeed, /"beneficiary_sbu_head"/);
  assert.match(engine, /beneficiarySBU \|\| memo\.requestingSbu/);
  assert.match(engine, /workflowRole: "HEAD_OF_SBU"/);
  assert.match(stepModel, /beneficiary_sbu_head/);
  assert.match(memoService, /beneficiarySBU = beneficiarySBU \|\| requestingSbu/);
  assert.match(memoService, /populate\(\{ path: "position", select: "sbu" \}\)/);
});

test("Ringo Fine & Levy is consolidated to one service with both requisition types", () => {
  assert.match(serviceSeed, /slug: "admin-fine-levy"[^\n]*allowedRequisitionTypes: \["Admin Requisition", "SBU Requisition"\]/);
  assert.match(serviceSeed, /slug: "sbu-fine-levy"/);
  assert.match(serviceSeed, /slug: "sbu-fine-levy", active: true \},\s*\{ \$set: \{ active: false \} \}/);
});

test("workflow deactivation protects service mappings and existing workflow history", () => {
  assert.match(workflowService, /WorkflowInstance\.countDocuments/);
  assert.match(workflowService, /requisitionWorkflowMap/);
  assert.match(workflowService, /Reassign .* before deactivating this workflow/);
});

test("Ringo pilot catalogue and workflow seed are synchronized on API startup", async () => {
  const server = await readFile(path.resolve(here, "../src/server.js"), "utf8");
  assert.match(server, /Company\.findOne\(\{ code: "RINGO"/);
  assert.match(server, /await seedBusinessServices\(ringo\)/);
  assert.match(server, /await seedRingoApprovalConfiguration\(ringo\)/);
  assert.match(server, /await seedFinanceRole\(ringo\)/);
});

test("Ringo catalogue includes the supplied requisition types and bill service examples", () => {
  assert.match(serviceSeed, /allowedRequisitionTypes: \["Admin Requisition"\]/);
  assert.match(serviceSeed, /allowedRequisitionTypes: \["SBU Requisition"\]/);
  assert.match(serviceSeed, /allowedRequisitionTypes: \["IT Requisition"\]/);
  for (const slug of ["electricity-utility-bills", "internet-telecommunications-bills", "facility-maintenance-bills", "vendor-invoices", "recurring-company-bills"]) {
    assert.ok(serviceSeed.includes(`slug: "${slug}"`), `Missing Ringo service ${slug}`);
  }
});
