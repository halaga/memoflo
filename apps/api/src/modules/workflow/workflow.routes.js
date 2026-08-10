import express from "express";
import authenticate from "../auth/auth.middleware.js";
import WorkflowController from "./workflow.controller.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/resolve-position/:positionId",
  WorkflowController.resolvePosition
);

export default router;