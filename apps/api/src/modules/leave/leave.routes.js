import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import LeaveController from "./leave.controller.js";

const router = express.Router();

// Leave is an employee self-service module. Any authenticated active employee
// can view balances/types and submit their own request; approval authority is
// still controlled by the request's supervisor/SBU Head and leave.approve.
router.use(authenticate);

router.get("/types", LeaveController.types);
router.get("/balances", LeaveController.balances);
router.get("/requests", LeaveController.requests);
router.get("/requests/:id", LeaveController.show);
router.post("/requests", LeaveController.create);
router.post("/requests/:id/decision", LeaveController.decide);
router.post("/requests/:id/file", LeaveController.file);
router.post("/requests/:id/cancel", LeaveController.cancel);

router.post("/types", authorize("leave.manage"), LeaveController.createType);
router.patch("/types/:id", authorize("leave.manage"), LeaveController.updateType);

export default router;
