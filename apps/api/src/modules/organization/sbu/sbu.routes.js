import express from "express";

import authorize from "../../../middleware/authorize.js";
import authenticate from "../../auth/auth.middleware.js";
import SBUController from "./sbu.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("employees.update"),
  SBUController.create
);
router.get(
  "/",
  authorize("employees.view"),
  SBUController.list
);
router.get(
  "/:id",
  authorize("employees.view"),
  SBUController.show
);
router.patch(
  "/:id",
  authorize("employees.update"),
  SBUController.update
);
router.delete(
  "/:id",
  authorize("employees.update"),
  SBUController.remove
);

export default router;
