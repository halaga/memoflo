import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const employeeDocumentSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    documentType: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    storagePath: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    expiryDate: { type: Date, default: null },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    ...BaseSchema,
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ company: 1, employee: 1, documentType: 1 });

export default mongoose.model("EmployeeDocument", employeeDocumentSchema);
