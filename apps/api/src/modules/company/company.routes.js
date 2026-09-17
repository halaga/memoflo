import express from "express";

import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import CompanyController from "./company.controller.js";

const router = express.Router();

router.get("/public/:slug", CompanyController.public);

router.use(authenticate);

router.get("/workspace", CompanyController.workspace);
router.patch(
  "/modules",
  authorize("company.modules.update"),
  CompanyController.updateModules
);
router.patch(
  "/branding",
  authorize("company.branding.update"),
  CompanyController.updateBranding
);

export default router;
