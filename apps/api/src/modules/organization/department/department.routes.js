import express from "express";
import authenticate from "../../auth/auth.middleware.js";
import DepartmentController from "./department.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", DepartmentController.create);

router.get("/", DepartmentController.list);

router.get("/:id", DepartmentController.show);

router.patch("/:id", DepartmentController.update);

router.delete("/:id", DepartmentController.remove);

export default router;