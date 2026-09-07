import express from "express";
import authenticate from "../auth/auth.middleware.js";
import WorkflowController from "./workflow.controller.js";

const router = express.Router();

router.use(authenticate);

// Workflow definitions

router.post(
  "/",
  WorkflowController.create
);

router.get(
  "/",
  WorkflowController.list
);

// Position resolution

router.get(
  "/resolve-position/:positionId",
  WorkflowController.resolvePosition
);

// Workflow execution

router.post(
  "/:id/start",
  WorkflowController.start
);

router.get(
  "/instances/:instanceId",
  WorkflowController.instance
);

router.get(
  "/instances/:instanceId/current-step",
  WorkflowController.currentStep
);

router.post(
  "/instances/:instanceId/advance",
  WorkflowController.advance
);

router.post(
  "/instances/:instanceId/reject",
  WorkflowController.reject
);

router.post(
  "/instances/:instanceId/cancel",
  WorkflowController.cancel
);

router.post(
  "/instances/:instanceId/resubmit",
  WorkflowController.resubmitInstance
);

// Workflow steps

router.post(
  "/:id/steps",
  WorkflowController.addStep
);

router.patch(
  "/:id/steps/:stepId",
  WorkflowController.updateStep
);

router.patch(
  "/:id/steps/:stepId/reactivate",
  WorkflowController.reactivateStep
);

router.delete(
  "/:id/steps/:stepId",
  WorkflowController.deleteStep
);

// Workflow definition by ID

router.get(
  "/:id",
  WorkflowController.show
);

router.patch(
  "/:id",
  WorkflowController.update
);

router.delete(
  "/:id",
  WorkflowController.remove
);

export default router;