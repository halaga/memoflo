import express from "express";
import authenticate from "../auth/auth.middleware.js";
import MemoController from "./memo.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", MemoController.create);

router.get("/", MemoController.list);

router.get("/:id", MemoController.show);

router.patch("/:id", MemoController.update);

export default router;