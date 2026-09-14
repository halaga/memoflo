import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import NotificationController from "./notification.controller.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("notifications.view"),
  NotificationController.list
);

router.patch(
  "/read-all",
  authorize("notifications.update"),
  NotificationController.readAll
);

router.patch(
  "/:id/read",
  authorize("notifications.update"),
  NotificationController.read
);

export default router;
