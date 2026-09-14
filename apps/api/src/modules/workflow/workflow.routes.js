import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import WorkflowController from "./workflow.controller.js";

const router = express.Router();

router.use(authenticate);

// Workflow definitions
router.post(
  "/",
  authorize("workflow.create"),
  WorkflowController.create
);

router.get(
  "/",
  authorize("workflow.view"),
  WorkflowController.list
);

router.get(
  "/resolve-position/:positionId",
  authorize("workflow.view"),
  WorkflowController.resolvePosition
);

// Workflow execution
router.post(
  "/:id/start",
  authorize("workflow.execute"),
  WorkflowController.start
);

router.get(
  "/instances/:instanceId",
  authorize("workflow.view"),
  WorkflowController.instance
);

router.get(
  "/instances/:instanceId/current-step",
  authorize("workflow.view"),
  WorkflowController.currentStep
);

router.post(
  "/instances/:instanceId/advance",
  authorize("workflow.execute"),
  WorkflowController.advance
);

router.post(
  "/instances/:instanceId/reject",
  authorize("workflow.execute"),
  WorkflowController.reject
);

router.post(
  "/instances/:instanceId/cancel",
  authorize("workflow.execute"),
  WorkflowController.cancel
);

router.post(
  "/instances/:instanceId/resubmit",
  authorize("workflow.execute"),
  WorkflowController.resubmitInstance
);

// Workflow steps
router.post(
  "/:id/steps",
  authorize("workflow.update"),
  WorkflowController.addStep
);

router.patch(
  "/:id/steps/:stepId",
  authorize("workflow.update"),
  WorkflowController.updateStep
);

router.patch(
  "/:id/steps/:stepId/reactivate",
  authorize("workflow.update"),
  WorkflowController.reactivateStep
);

router.delete(
  "/:id/steps/:stepId",
  authorize("workflow.update"),
  WorkflowController.deleteStep
);

// Workflow definition by ID
router.get(
  "/:id",
  authorize("workflow.view"),
  WorkflowController.show
);

router.patch(
  "/:id",
  authorize("workflow.update"),
  WorkflowController.update
);

router.delete(
  "/:id",
  authorize("workflow.delete"),
  WorkflowController.remove
);

export default router;
