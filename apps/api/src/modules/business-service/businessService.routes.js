import express from "express";

import authenticate from "../auth/auth.middleware.js";

import BusinessServiceController from "./businessService.controller.js";

const router = express.Router();

router.use(authenticate);

// Business services

router.post(
  "/",
  BusinessServiceController.create
);

router.get(
  "/",
  BusinessServiceController.list
);

// Put specific routes before /:id

router.get(
  "/slug/:slug",
  BusinessServiceController.showBySlug
);

router.patch(
  "/:id/workflow",
  BusinessServiceController.assignWorkflow
);

router.get(
  "/:id",
  BusinessServiceController.show
);

router.patch(
  "/:id",
  BusinessServiceController.update
);

router.delete(
  "/:id",
  BusinessServiceController.remove
);

export default router;