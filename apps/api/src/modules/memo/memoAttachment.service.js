import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Memo from "./memo.model.js";
import MemoAttachment from "./memoAttachment.model.js";
import MemoEventService from "../memo-event/memoEvent.service.js";

const STORAGE_ROOT = path.resolve(process.env.MEMOFLO_STORAGE_PATH || "storage");
const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeOriginalName(name) {
  return path.basename(String(name || "attachment")).replace(/[\\/:*?"<>|\0]/g, "_");
}

function validateFile(file) {
  if (!file) {
    const error = new Error("Attachment file is required");
    error.status = 400;
    throw error;
  }

  if (file.size > MAX_SIZE) {
    const error = new Error("Attachment exceeds the 10 MB limit");
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("This file type is not supported");
    error.status = 400;
    throw error;
  }
}

class MemoAttachmentService {
  async upload({ companyId, memoId, employeeId, file }) {
    validateFile(file);

    const memo = await Memo.findOne({
      _id: memoId,
      company: companyId,
      isActive: true,
      deletedAt: null,
    }).select("_id referenceNo title");

    if (!memo) {
      const error = new Error("Memo not found");
      error.status = 404;
      throw error;
    }

    const storedName = `${crypto.randomUUID()}${path.extname(safeOriginalName(file.originalname))}`;
    const relativePath = path.join(
      "companies",
      String(companyId),
      "memos",
      String(memoId),
      storedName
    );
    const absoluteDirectory = path.join(STORAGE_ROOT, path.dirname(relativePath));
    const absolutePath = path.join(STORAGE_ROOT, relativePath);

    await fs.mkdir(absoluteDirectory, { recursive: true });
    await fs.rename(file.path, absolutePath);

    try {
      const attachment = await MemoAttachment.create({
        company: companyId,
        memo: memoId,
        uploadedBy: employeeId,
        originalName: safeOriginalName(file.originalname),
        storedName,
        storagePath: relativePath,
        mimeType: file.mimetype,
        size: file.size,
      });

      await MemoEventService.record({
        company: companyId,
        memo: memoId,
        actor: employeeId,
        type: "attachment.uploaded",
        title: "Attachment added",
        description: `${attachment.originalName} was attached to memo ${memo.referenceNo}.`,
        metadata: {
          attachmentId: attachment._id,
          fileName: attachment.originalName,
          mimeType: attachment.mimeType,
          fileSize: attachment.size,
          referenceNo: memo.referenceNo,
        },
      });

      return attachment;
    } catch (error) {
      await fs.rm(absolutePath, { force: true });
      throw error;
    }
  }

  async list(companyId, memoId) {
    return MemoAttachment.find({ company: companyId, memo: memoId })
      .populate("uploadedBy", "_id firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();
  }

  async get(companyId, memoId, attachmentId) {
    return MemoAttachment.findOne({
      _id: attachmentId,
      company: companyId,
      memo: memoId,
    });
  }

  async remove({ companyId, memoId, attachmentId, employeeId }) {
    const attachment = await this.get(companyId, memoId, attachmentId);

    if (!attachment) {
      const error = new Error("Attachment not found");
      error.status = 404;
      throw error;
    }

    const memo = await Memo.findOne({
      _id: memoId,
      company: companyId,
    }).select("referenceNo");

    await fs.rm(path.join(STORAGE_ROOT, attachment.storagePath), {
      force: true,
    });
    await attachment.deleteOne();

    await MemoEventService.record({
      company: companyId,
      memo: memoId,
      actor: employeeId,
      type: "attachment.removed",
      title: "Attachment removed",
      description: `${attachment.originalName} was removed from memo ${memo?.referenceNo || memoId}.`,
      metadata: {
        attachmentId: attachment._id,
        fileName: attachment.originalName,
        referenceNo: memo?.referenceNo,
      },
    });
  }
}

export { STORAGE_ROOT, MAX_SIZE, ALLOWED_MIME_TYPES };
export default new MemoAttachmentService();
