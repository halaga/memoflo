import express from "express";
import authenticate from "../auth/auth.middleware.js";
import WorkflowController from "./workflow.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", WorkflowController.create);

router.get("/", WorkflowController.list);

router.get("/:id", WorkflowController.show);

router.patch("/:id", WorkflowController.update);

router.delete("/:id", WorkflowController.remove);

router.post(
  "/:id/steps",
  WorkflowController.addStep
);

export default router;