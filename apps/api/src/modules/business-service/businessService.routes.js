import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import BusinessServiceController from "./businessService.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("business-services.create"),
  BusinessServiceController.create
);

router.get(
  "/",
  authorize("business-services.view"),
  BusinessServiceController.list
);

router.get(
  "/slug/:slug",
  authorize("business-services.view"),
  BusinessServiceController.showBySlug
);

router.get(
  "/:id",
  authorize("business-services.view"),
  BusinessServiceController.show
);

router.patch(
  "/:id",
  authorize("business-services.update"),
  BusinessServiceController.update
);

router.delete(
  "/:id",
  authorize("business-services.delete"),
  BusinessServiceController.remove
);

export default router;
