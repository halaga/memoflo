import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Memo from "../memo/memo.model.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import MemoAttachment from "./memoAttachment.model.js";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const ALLOWED = new Set([
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
const MAX_BYTES = 10 * 1024 * 1024;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getMemo(company, memoId) {
  const memo = await Memo.findOne({ _id: memoId, company, isActive: true, deletedAt: null }).select("_id referenceNo title");
  if (!memo) throw fail("Memo not found", 404);
  return memo;
}

class MemoAttachmentService {
  async list(company, memoId) {
    await getMemo(company, memoId);
    return MemoAttachment.find({ company, memo: memoId }).populate("uploadedBy", "_id firstName lastName email").sort({ createdAt: -1 }).lean();
  }

  async add({ company, memoId, employeeId, file }) {
    const memo = await getMemo(company, memoId);
    if (!file) throw fail("Choose a file to upload.");
    if (file.size > MAX_BYTES) throw fail("Attachments are limited to 10 MB per file.");
    if (!ALLOWED.has(file.mimetype)) throw fail("This file type is not supported.");

    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${crypto.randomUUID()}-${safeName}`;
    const relativeDir = path.join("companies", String(company), "memos", String(memoId));
    const absoluteDir = path.join(STORAGE_ROOT, relativeDir);
    const relativePath = path.join(relativeDir, storedName);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.rename(file.path, path.join(absoluteDir, storedName));

    const attachment = await MemoAttachment.create({ company, memo: memo._id, uploadedBy: employeeId, originalName: file.originalname, storedName, relativePath, mimeType: file.mimetype, size: file.size });
    await MemoEventService.record({ company, memo: memo._id, actor: employeeId, type: "memo.attachment_added", title: "Attachment added", description: `${file.originalname} was attached to the memo.`, metadata: { attachmentId: attachment._id.toString(), fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size } });
    return attachment;
  }

  async getFile(company, memoId, attachmentId) {
    const attachment = await MemoAttachment.findOne({ _id: attachmentId, company, memo: memoId }).lean();
    if (!attachment) throw fail("Attachment not found", 404);
    const absolutePath = path.resolve(STORAGE_ROOT, attachment.relativePath);
    if (!absolutePath.startsWith(STORAGE_ROOT)) throw fail("Invalid attachment path", 400);
    return { attachment, absolutePath };
  }

  async remove(company, memoId, attachmentId, employeeId) {
    const { attachment, absolutePath } = await this.getFile(company, memoId, attachmentId);
    await fs.rm(absolutePath, { force: true });
    await MemoAttachment.deleteOne({ _id: attachment._id, company, memo: memoId });
    await MemoEventService.record({ company, memo: memoId, actor: employeeId, type: "memo.attachment_removed", title: "Attachment removed", description: `${attachment.originalName} was removed from the memo.`, metadata: { attachmentId: attachment._id.toString(), fileName: attachment.originalName } });
    return attachment;
  }
}

export { MAX_BYTES, ALLOWED };
export default new MemoAttachmentService();
