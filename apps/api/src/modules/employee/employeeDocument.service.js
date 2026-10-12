import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import Employee from "./employee.model.js";
import EmployeeDocument from "./employeeDocument.model.js";

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

const STORAGE_ROOT = () => path.resolve(process.env.MEMOFLO_STORAGE_PATH || "storage");
const DOCUMENT_ROOT = () => path.join(STORAGE_ROOT(), "companies");

export const REQUIRED_EMPLOYEE_DOCUMENTS = [
  "Government ID",
  "Employment Contract",
  "CV / Resume",
  "Qualification / Certificate",
  "Passport Photograph",
];

async function findEmployee(companyId, employeeId) {
  return Employee.findOne({
    _id: employeeId,
    company: companyId,
    active: true,
    deletedAt: null,
  }).select("_id firstName lastName");
}

class EmployeeDocumentService {
  async list(companyId, employeeId) {
    const employee = await findEmployee(companyId, employeeId);
    if (!employee) fail("Employee not found.", 404);

    const documents = await EmployeeDocument.find({
      company: companyId,
      employee: employeeId,
      isActive: true,
      deletedAt: null,
    }).sort({ createdAt: -1 }).lean();

    const uploadedTypes = new Set(documents.map((document) => document.documentType));
    const required = REQUIRED_EMPLOYEE_DOCUMENTS.map((documentType) => ({
      documentType,
      required: true,
      uploaded: uploadedTypes.has(documentType),
    }));

    return { documents, required };
  }

  async upload(companyId, employeeId, actorId, file, documentType, expiryDate) {
    if (!file) fail("Document file is required.");
    if (!REQUIRED_EMPLOYEE_DOCUMENTS.includes(documentType)) {
      fail("Unsupported employee document type.");
    }

    const employee = await findEmployee(companyId, employeeId);
    if (!employee) fail("Employee not found.", 404);

    const allowedTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    if (!allowedTypes.has(file.mimetype)) fail("Upload a PDF, Word document or image.");
    if (file.size > 10 * 1024 * 1024) fail("Employee documents must be 10 MB or smaller.");

    const directory = path.join(
      DOCUMENT_ROOT(),
      String(companyId),
      "employees",
      String(employeeId),
      "documents"
    );
    await fs.mkdir(directory, { recursive: true });

    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}-${safeName}`;
    const absolutePath = path.join(directory, filename);
    await fs.writeFile(absolutePath, file.buffer);

    const relativePath = path.relative(STORAGE_ROOT(), absolutePath).replaceAll(path.sep, "/");
    try {
      return await EmployeeDocument.create({
        company: companyId,
        employee: employeeId,
        documentType,
        name: file.originalname,
        storagePath: relativePath,
        mimeType: file.mimetype,
        size: file.size,
        required: true,
        expiryDate: expiryDate || null,
        uploadedBy: actorId,
      });
    } catch (error) {
      await fs.rm(absolutePath, { force: true });
      throw error;
    }
  }

  async remove(companyId, documentId) {
    const document = await EmployeeDocument.findOne({
      _id: documentId,
      company: companyId,
      isActive: true,
      deletedAt: null,
    });
    if (!document) fail("Employee document not found.", 404);

    const absolutePath = path.resolve(STORAGE_ROOT(), document.storagePath);
    const allowedRoot = `${DOCUMENT_ROOT()}${path.sep}`;
    if (!absolutePath.startsWith(allowedRoot)) fail("Invalid document storage path.", 400);

    await fs.rm(absolutePath, { force: true });
    await EmployeeDocument.updateOne(
      { _id: document._id },
      { $set: { isActive: false, deletedAt: new Date() } }
    );
    return document;
  }

  async getDownload(companyId, documentId) {
    const document = await EmployeeDocument.findOne({
      _id: documentId,
      company: companyId,
      isActive: true,
      deletedAt: null,
    });
    if (!document) fail("Employee document not found.", 404);

    const absolutePath = path.resolve(STORAGE_ROOT(), document.storagePath);
    const allowedRoot = `${DOCUMENT_ROOT()}${path.sep}`;
    if (!absolutePath.startsWith(allowedRoot)) fail("Invalid document storage path.", 400);

    try {
      await fs.access(absolutePath);
    } catch {
      fail("Document file is missing from storage.", 404);
    }

    return { doc: document, absolute: absolutePath };
  }
}

export default new EmployeeDocumentService();
