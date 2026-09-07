import express from "express";
import authenticate from "../auth/auth.middleware.js";
import BusinessServiceController from "./businessService.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  BusinessServiceController.create
);

router.get(
  "/",
  BusinessServiceController.list
);

router.get(
  "/slug/:slug",
  BusinessServiceController.showBySlug
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