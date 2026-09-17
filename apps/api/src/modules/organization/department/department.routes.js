import express from "express";

import authorize from "../../../middleware/authorize.js";
import authenticate from "../../auth/auth.middleware.js";
import DepartmentController from "./department.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("employees.update"),
  DepartmentController.create
);
router.get(
  "/",
  authorize("employees.view"),
  DepartmentController.list
);
router.get(
  "/:id",
  authorize("employees.view"),
  DepartmentController.show
);
router.patch(
  "/:id",
  authorize("employees.update"),
  DepartmentController.update
);
router.delete(
  "/:id",
  authorize("employees.update"),
  DepartmentController.remove
);

export default router;
