import express from "express";

import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import { listAuditLogs } from "./audit.controller.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("audit.view"),
  listAuditLogs
);

export default router;
