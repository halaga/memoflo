import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import express from "express";
import multer from "multer";
import authorize from "../../middleware/authorize.js";
import authenticate from "../auth/auth.middleware.js";
import EmployeeDocumentService from "./employeeDocument.service.js";
import Employee from "./employee.model.js";
import EmployeeController from "./employee.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get("/directory", EmployeeController.directory);

router.get(
  "/documents/:documentId/download",
  authorize("employees.view"),
  async (req, res, next) => {
    try {
      const { doc, absolute } = await EmployeeDocumentService.getDownload(
        req.user.company,
        req.params.documentId
      );
      res.download(absolute, doc.name);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/documents/:documentId",
  authorize("employees.update"),
  async (req, res, next) => {
    try {
      const document = await EmployeeDocumentService.remove(
        req.user.company,
        req.params.documentId
      );
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id/documents",
  authorize("employees.view"),
  async (req, res, next) => {
    try {
      const data = await EmployeeDocumentService.list(
        req.user.company,
        req.params.id
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/documents",
  authorize("employees.update"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const document = await EmployeeDocumentService.upload(
        req.user.company,
        req.params.id,
        req.user.id,
        req.file,
        req.body.documentType,
        req.body.expiryDate
      );
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/avatar",
  authorize("employees.update"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file || !["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
        const error = new Error("Upload a JPG, PNG or WebP profile photo.");
        error.status = 400;
        throw error;
      }
      if (req.file.size > 5 * 1024 * 1024) {
        const error = new Error("Profile photo must be 5 MB or smaller.");
        error.status = 400;
        throw error;
      }

      const employee = await Employee.findOne({
        _id: req.params.id,
        company: req.user.company,
        active: true,
        deletedAt: null,
      });
      if (!employee) {
        const error = new Error("Employee not found.");
        error.status = 404;
        throw error;
      }

      const storageRoot = path.resolve(process.env.MEMOFLO_STORAGE_PATH || "storage");
      const directory = path.join(
        storageRoot,
        "public",
        "avatars",
        String(req.user.company),
        String(employee._id)
      );
      await fs.mkdir(directory, { recursive: true });

      const extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      }[req.file.mimetype];
      const filename = `avatar-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${extension}`;
      await fs.writeFile(path.join(directory, filename), req.file.buffer);

      employee.avatar = `/uploads/avatars/${req.user.company}/${employee._id}/${filename}`;
      await employee.save();

      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", authorize("employees.create"), EmployeeController.create);
router.get("/", authorize("employees.view"), EmployeeController.list);
router.get("/:id", authorize("employees.view"), EmployeeController.show);
router.patch("/:id/reset-password", authorize("employees.update"), EmployeeController.resetPassword);
router.patch("/:id", authorize("employees.update"), EmployeeController.update);
router.delete("/:id", authorize("employees.delete"), EmployeeController.remove);

export default router;
