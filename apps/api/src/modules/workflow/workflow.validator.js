export function validateCreateWorkflow(payload) {
  if (!payload.name) {
    throw new Error("Workflow name is required");
  }

  if (!payload.code) {
    throw new Error("Workflow code is required");
  }
}

export function validateCreateWorkflowStep(payload) {
  if (
    payload.order === undefined ||
    payload.order === null
  ) {
    throw new Error("Step order is required");
  }

  if (!payload.name) {
    throw new Error("Step name is required");
  }

  if (!payload.action) {
    throw new Error("Step action is required");
  }
}