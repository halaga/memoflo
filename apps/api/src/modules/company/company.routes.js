import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import CompanyController from "./company.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/workspace", CompanyController.workspace);
router.patch("/modules", authorize("company.modules.update"), CompanyController.updateModules);

export default router;
