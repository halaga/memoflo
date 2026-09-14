import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import MemoController from "./memo.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("memos.create"),
  MemoController.create
);

router.get(
  "/",
  authorize("memos.view"),
  MemoController.list
);

router.get(
  "/:id",
  authorize("memos.view"),
  MemoController.show
);

router.patch(
  "/:id",
  authorize("memos.update"),
  MemoController.update
);

export default router;
