import express from "express";

import * as controller from "./auth.controller.js";
import authorize from "../../middleware/authorize.js";

const router = express.Router();

router.post(
  "/login",
  controller.login
);

router.get(
  "/me",
  authorize,
  controller.me
);

export default router;