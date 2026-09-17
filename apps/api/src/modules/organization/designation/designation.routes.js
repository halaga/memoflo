import express from "express";

import authorize from "../../../middleware/authorize.js";
import authenticate from "../../auth/auth.middleware.js";
import DesignationController from "./designation.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("employees.update"),
  DesignationController.create
);
router.get(
  "/",
  authorize("employees.view"),
  DesignationController.list
);
router.get(
  "/:id",
  authorize("employees.view"),
  DesignationController.show
);
router.patch(
  "/:id",
  authorize("employees.update"),
  DesignationController.update
);
router.delete(
  "/:id",
  authorize("employees.update"),
  DesignationController.remove
);

export default router;
