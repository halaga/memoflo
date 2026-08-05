import express from "express";
import EmployeeController from "./employee.controller.js";

const router = express.Router();

router.post("/", EmployeeController.create);

router.get("/:companyId", EmployeeController.getAll);

router.get("/profile/:id", EmployeeController.getOne);

router.patch("/:id", EmployeeController.update);

router.delete("/:id", EmployeeController.deactivate);

export default router;