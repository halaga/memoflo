import express from "express";
import authenticate from "../auth/auth.middleware.js";
import ServiceRequestController from "./serviceRequest.controller.js";
const router = express.Router();
router.use(authenticate);
router.get("/", ServiceRequestController.list);
router.post("/", ServiceRequestController.create);
export default router;
