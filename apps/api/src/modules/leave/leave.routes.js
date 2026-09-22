import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import LeaveController from "./leave.controller.js";

const router = express.Router();
router.use(authenticate);
router.use(authorize("leave.view"));

router.get("/types", LeaveController.types);
router.get("/balances", LeaveController.balances);
router.get("/requests", LeaveController.requests);
router.get("/requests/:id", LeaveController.show);
router.post("/requests", authorize("leave.create"), LeaveController.create);
router.post("/requests/:id/decision", LeaveController.decide);
router.post("/requests/:id/cancel", LeaveController.cancel);
router.post("/types", LeaveController.createType);
router.patch("/types/:id", LeaveController.updateType);

export default router;
