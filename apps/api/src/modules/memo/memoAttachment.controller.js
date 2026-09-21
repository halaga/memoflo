import fs from "node:fs";
import MemoAttachmentService, {
  STORAGE_ROOT,
} from "./memoAttachment.service.js";

class MemoAttachmentController {
  async list(req, res, next) {
    try {
      const attachments = await MemoAttachmentService.list(
        req.user.company,
        req.params.memoId
      );
      res.json({ success: true, data: attachments });
    } catch (error) {
      next(error);
    }
  }

  async upload(req, res, next) {
    try {
      const attachment = await MemoAttachmentService.upload({
        companyId: req.user.company,
        memoId: req.params.memoId,
        employeeId: req.user.id,
        file: req.file,
      });
      res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      next(error);
    }
  }

  async download(req, res, next) {
    try {
      const attachment = await MemoAttachmentService.get(
        req.user.company,
        req.params.memoId,
        req.params.attachmentId
      );

      if (!attachment) {
        const error = new Error("Attachment not found");
        error.status = 404;
        throw error;
      }

      const absolutePath = `${STORAGE_ROOT}/${attachment.storagePath}`;
      if (!fs.existsSync(absolutePath)) {
        const error = new Error("Attachment file is missing from storage");
        error.status = 404;
        throw error;
      }

      res.download(absolutePath, attachment.originalName);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await MemoAttachmentService.remove({
        companyId: req.user.company,
        memoId: req.params.memoId,
        attachmentId: req.params.attachmentId,
        employeeId: req.user.id,
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new MemoAttachmentController();
