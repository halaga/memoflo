import express from "express";
import authenticate from "../../auth/auth.middleware.js";
import SBUController from "./sbu.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", SBUController.create);
router.get("/", SBUController.list);
router.get("/:id", SBUController.show);
router.patch("/:id", SBUController.update);
router.delete("/:id", SBUController.remove);

export default router;
