import express from "express";
import authenticate from "../../auth/auth.middleware.js";
import SBUController from "./sbu.controller.js";

const router = express.Router();
router.use(authenticate);
router.get("/", SBUController.list);
router.get("/:id", SBUController.show);

export default router;
