import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import Memo from "../memo/memo.model.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import MemoAttachment from "./memoAttachment.model.js";
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(MODULE_DIR, "../../..");
// Relative storage configuration is anchored to the API package, not process.cwd().
const configuredStorage = process.env.MEMOFLO_STORAGE_PATH || "storage";
const STORAGE_ROOT = path.isAbsolute(configuredStorage)
    ? path.resolve(configuredStorage)
    : path.resolve(API_ROOT, configuredStorage);
// Include the locations used by previous MemoFlo releases. Reads remain scoped
// to the memo/company metadata; this list only preserves on-disk compatibility.
const LEGACY_STORAGE_ROOTS = [...new Set([
        STORAGE_ROOT,
        path.resolve(API_ROOT, "storage"),
        path.resolve(process.cwd(), "storage"),
        path.resolve(MODULE_DIR, "../../../../../storage"),
    ])];
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
function safeRelativePath(value) {
    const normalized = String(value || "").replace(/[\\\\/]+/g, path.sep);
    if (!normalized || path.isAbsolute(normalized) || normalized.split(path.sep).some((part) => part === "..")) {
        throw fail("Invalid attachment path", 400);
    }
    return normalized;
}
async function locateStoredFile(relativePath) {
    const safePath = safeRelativePath(relativePath);
    for (const root of LEGACY_STORAGE_ROOTS) {
        const absolutePath = path.resolve(root, safePath);
        const fromRoot = path.relative(root, absolutePath);
        if (!fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot))
            continue;
        try {
            // realpath also prevents a symlink inside storage from escaping its root.
            const [realRoot, realFile] = await Promise.all([fs.realpath(root), fs.realpath(absolutePath)]);
            const realRelative = path.relative(realRoot, realFile);
            if (!realRelative || realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative))
                continue;
            const stat = await fs.stat(realFile);
            if (!stat.isFile())
                continue;
            return realFile;
        }
        catch { /* Try the next known storage root for files uploaded before this fix. */ }
    }
    throw fail("Attachment file is missing from storage. The attachment record exists, but the stored file could not be found.",
        404);
}
async function getMemo(company, memoId) {
const memo = await Memo.findOne({
    _id: memoId, company,
    isActive: true,
    deletedAt: null
}).select("_id referenceNo title");
    if (!memo)
        throw fail("Memo not found", 404);
    return memo;
}
class MemoAttachmentService {
    async list(company, memoId) {
        await getMemo(company, memoId);
return MemoAttachment.find({
    company,
    memo: memoId
}).populate("uploadedBy", "_id firstName lastName email").sort({ createdAt: -1 }).lean();
    }
    async add({ company, memoId, employeeId, file }) {
        let storedAbsolutePath = null;
        let movedFile = false;
        try {
            const memo = await getMemo(company, memoId);
            if (!file)
                throw fail("Choose a file to upload.");
            if (file.size > MAX_BYTES)
                throw fail("Attachments are limited to 10 MB per file.");
            if (!ALLOWED.has(file.mimetype))
                throw fail("This file type is not supported.");
            const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
            const storedName = `${crypto.randomUUID()}-${safeName}`;
            const relativeDir = path.join("companies", String(company), "memos", String(memoId));
            const absoluteDir = path.join(STORAGE_ROOT, relativeDir);
            const relativePath = path.join(relativeDir, storedName);
            storedAbsolutePath = path.resolve(STORAGE_ROOT, relativePath);
            // Do not allow generated or persisted paths to escape the configured storage root.
            const fromRoot = path.relative(STORAGE_ROOT, storedAbsolutePath);
            if (!fromRoot || fromRoot.startsWith(`..${path.sep}`) || fromRoot === ".." || path.isAbsolute(fromRoot)) {
                throw fail("Invalid attachment path", 400);
            }
            await fs.mkdir(absoluteDir, { recursive: true });
            await fs.rename(file.path, storedAbsolutePath);
            movedFile = true;
            const attachment = await MemoAttachment.create({
                company,
                memo: memo._id,
                uploadedBy: employeeId,
                originalName: file.originalname,
                storedName,
                relativePath,
                mimeType: file.mimetype,
                size: file.size,
            });
            try {
                await MemoEventService.record({
                    company,
                    memo: memo._id,
                    actor: employeeId,
                    type: "memo.attachment_added",
                    title: "Attachment added",
                    description: `${file.originalname} was attached to the memo.`,
                    metadata: {
                        attachmentId: attachment._id.toString(),
                        fileName: file.originalname,
                        mimeType: file.mimetype,
                        fileSize: file.size,
                    },
                });
            }
            catch (error) {
                await MemoAttachment.deleteOne({
                    _id: attachment._id, company,
                    memo: memo._id
                });
                throw error;
            }
            return attachment;
        }
        catch (error) {
            // Multer writes to a temporary directory; clean up rejected uploads and partial writes.
            if (file?.path)
                await fs.rm(file.path, { force: true }).catch(() => { });
            if (movedFile && storedAbsolutePath)
                await fs.rm(storedAbsolutePath, { force: true }).catch(() => { });
            throw error;
        }
    }
    async getFile(company, memoId, attachmentId) {
        const attachment = await MemoAttachment.findOne({
            _id: attachmentId, company,
            memo: memoId
        }).lean();
        if (!attachment)
            throw fail("Attachment not found", 404);
        // Older MemoFlo builds stored this field as `storagePath`; newer records use `relativePath`.
        const storedPath = attachment.relativePath || attachment.storagePath;
        if (!storedPath)
            throw fail("Attachment record has no storage path.", 404);
        const absolutePath = await locateStoredFile(storedPath);
        return { attachment, absolutePath };
    }
    async remove(company, memoId, attachmentId, employeeId) {
        const { attachment, absolutePath } = await this.getFile(company, memoId, attachmentId);
        await fs.rm(absolutePath, { force: true });
        await MemoAttachment.deleteOne({
            _id: attachment._id, company,
            memo: memoId
        });
        await MemoEventService.record({ company, memo: memoId, actor: employeeId, type: "memo.attachment_removed", title: "Attachment removed",
             description: `${attachment.originalName} was removed from the memo.`, metadata: { attachmentId: attachment._id.toString(),
            fileName: attachment.originalName } });
        return attachment;
    }
}
export { MAX_BYTES, ALLOWED };
export default new MemoAttachmentService();
