import express from "express";

import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import PositionController from "./position.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("employees.update"),
  PositionController.create
);
router.get(
  "/",
  authorize("employees.view"),
  PositionController.list
);
router.get(
  "/:id",
  authorize("employees.view"),
  PositionController.show
);
router.patch(
  "/:id",
  authorize("employees.update"),
  PositionController.update
);
router.post(
  "/:id/assign",
  authorize("employees.update"),
  PositionController.assign
);
router.post(
  "/:id/vacate",
  authorize("employees.update"),
  PositionController.vacate
);
router.delete(
  "/:id",
  authorize("employees.update"),
  PositionController.remove
);

export default router;
