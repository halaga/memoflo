const ACTIONS = [
  "submit",
  "minute",
  "approve",
  "reject",
  "forward",
  "review",
  "complete",
  "archive",
  "cancel",
  "reopen",
  "resubmit",
  "pay",
  "receive",
  "acknowledge",
];

export function validateCreateWorkflow(payload) {
  if (!payload.name?.trim()) {
    throw new Error("Workflow name is required");
  }

  if (!payload.code?.trim()) {
    throw new Error("Workflow code is required");
  }
}

export function validateCreateWorkflowStep(payload) {
  const order = Number(payload.order);

  if (!Number.isInteger(order) || order < 1) {
    throw new Error("Step order must be a positive integer");
  }

  if (!payload.name?.trim()) {
    throw new Error("Step name is required");
  }

  if (!ACTIONS.includes(payload.action)) {
    throw new Error(
      `Invalid workflow action: ${payload.action}`
    );
  }

  if (!payload.position) {
    throw new Error("Workflow position is required");
  }
}

export { ACTIONS };
