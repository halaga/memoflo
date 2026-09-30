import express from "express";
import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import EmployeeController from "./employee.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("employees.create"),
  EmployeeController.create
);

router.get(
  "/",
  authorize("employees.view"),
  EmployeeController.list
);

router.get(
  "/:id",
  authorize("employees.view"),
  EmployeeController.show
);

router.patch(
  "/:id/reset-password",
  authorize("employees.update"),
  EmployeeController.resetPassword
);

router.patch(
  "/:id",
  authorize("employees.update"),
  EmployeeController.update
);

router.delete(
  "/:id",
  authorize("employees.delete"),
  EmployeeController.remove
);

export default router;
