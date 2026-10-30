import express from "express";
import rateLimit from "express-rate-limit";

import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import CompanyController from "./company.controller.js";

const router = express.Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts. Please try again later." },
});

router.post("/register", registrationLimiter, CompanyController.register);
router.get("/public/:slug", CompanyController.public);

router.use(authenticate);

router.get("/workspace", CompanyController.workspace);
router.patch(
  "/profile",
  authorize("company.branding.update"),
  CompanyController.updateProfile
);
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
