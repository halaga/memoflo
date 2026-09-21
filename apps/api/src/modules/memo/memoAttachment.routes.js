import express from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import authenticate from "../auth/auth.middleware.js";
import authorize from "../../middleware/authorize.js";
import MemoAttachmentController from "./memoAttachment.controller.js";

const router = express.Router();
const upload = multer({
  dest: path.join(os.tmpdir(), "memoflo-uploads"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get(
  "/:memoId",
  authorize("memos.view"),
  MemoAttachmentController.list
);

router.post(
  "/:memoId",
  authorize("memos.update"),
  upload.single("file"),
  MemoAttachmentController.upload
);

router.get(
  "/:memoId/:attachmentId/download",
  authorize("memos.view"),
  MemoAttachmentController.download
);

router.delete(
  "/:memoId/:attachmentId",
  authorize("memos.update"),
  MemoAttachmentController.remove
);

export default router;
