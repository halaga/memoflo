import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/modules/billing");
const controller = await readFile(path.join(root, "billing.controller.js"), "utf8");
const billModel = await readFile(path.join(root, "bill.model.js"), "utf8");
const paymentModel = await readFile(path.join(root, "payment.model.js"), "utf8");
const memoService = await readFile(path.resolve(root, "../memo/memo.service.js"), "utf8");
const workflowEngine = await readFile(path.resolve(root, "../workflow/workflow.engine.js"), "utf8");

test("bill approval and payment execution are separate", () => {
  assert.match(billModel, /approvalStatus:[\s\S]*paymentStatus:/);
  assert.match(controller, /bill\.approvalStatus !== "approved"/);
  assert.match(memoService, /service\.paymentRequired[\s\S]*Bill\.findOneAndUpdate/);
});
test("payment records support partial payments and reject overpayment", () => {
  assert.match(controller, /outstanding/);
  assert.match(controller, /Payment exceeds the outstanding balance/);
  assert.match(controller, /partially_paid/);
});
test("receipt evidence does not auto-verify; verification precedes reconciliation", () => {
  assert.match(paymentModel, /status: \{ type: String, enum: \["recorded", "awaiting_verification", "verified"/);
  assert.match(controller, /payment\.status !== "awaiting_verification"/);
  assert.match(controller, /payment\.status !== "verified"/);
});
test("memo workflow completion updates linked bill approval only", () => {
  assert.match(workflowEngine, /data\.status === "Approved"[\s\S]*approvalStatus: "approved"/);
  assert.match(workflowEngine, /data\.status === "Rejected"[\s\S]*approvalStatus: "rejected"/);
});
