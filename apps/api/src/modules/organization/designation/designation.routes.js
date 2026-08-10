import express from "express";
import authenticate from "../../auth/auth.middleware.js";
import DesignationController from "./designation.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", DesignationController.create);

router.get("/", DesignationController.list);

router.get("/:id", DesignationController.show);

router.patch("/:id", DesignationController.update);

router.delete("/:id", DesignationController.remove);

export default router;