import express from "express";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import MemoEventController from "./memoEvent.controller.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("administration.view"),
  MemoEventController.listCompany
);

router.get(
  "/memo/:memoId",
  authorize("memos.view"),
  MemoEventController.listForMemo
);

export default router;
