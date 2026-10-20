import express from "express";
import authenticate from "../auth/auth.middleware.js";
import ServiceRequestController from "./serviceRequest.controller.js";

const router = express.Router();
router.use(authenticate);
router.get("/", ServiceRequestController.list);
router.post("/", ServiceRequestController.create);
router.get("/:id", ServiceRequestController.get);
router.post("/:id/comments", ServiceRequestController.comment);
router.patch("/:id", ServiceRequestController.update);
export default router;
