import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import ProcurementController from "./procurement.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("procurement.view"), ProcurementController.list);
router.get("/:id", authorize("procurement.view"), ProcurementController.get);
router.post("/", authorize("procurement.create"), ProcurementController.create);
router.post("/:id/action", authorize("procurement.view"), ProcurementController.act);

export default router;
