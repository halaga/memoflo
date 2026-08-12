export function validateCreateWorkflow(
  payload
) {
  if (!payload.name) {
    throw new Error(
      "Workflow name is required"
    );
  }

  if (!payload.code) {
    throw new Error(
      "Workflow code is required"
    );
  }
}

export function validateCreateWorkflowStep(
  payload
) {
  if (
    payload.order === undefined ||
    payload.order === null
  ) {
    throw new Error(
      "Step order is required"
    );
  }

  if (
    !Number.isInteger(
      Number(payload.order)
    ) ||
    Number(payload.order) < 1
  ) {
    throw new Error(
      "Step order must be a positive integer"
    );
  }

  if (!payload.name) {
    throw new Error(
      "Step name is required"
    );
  }

  if (!payload.action) {
    throw new Error(
      "Step action is required"
    );
  }

  const allowedActions = [
    "submit",
    "minute",
    "approve",
    "reject",
    "forward",
    "review",
    "complete",
  ];

  if (
    !allowedActions.includes(
      payload.action
    )
  ) {
    throw new Error(
      `Invalid workflow action: ${payload.action}`
    );
  }
}