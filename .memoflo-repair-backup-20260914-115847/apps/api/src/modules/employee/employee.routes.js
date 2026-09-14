import express from "express";
import authenticate from "../auth/auth.middleware.js";
import EmployeeController from "./employee.controller.js";

const router = express.Router();

router.use(authenticate);

// Create Employee
router.post("/", EmployeeController.create);

// List Employees
router.get("/", EmployeeController.list);

// Employee Details
router.get("/:id", EmployeeController.show);

// Update Employee
router.patch("/:id", EmployeeController.update);

// Soft Delete Employee
router.delete("/:id", EmployeeController.remove);

export default router;