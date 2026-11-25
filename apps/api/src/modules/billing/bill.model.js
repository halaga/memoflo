import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const billSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  reference: { type: String, trim: true, required: true },
  category: { type: String, trim: true, required: true },
  vendor: { type: String, trim: true, required: true },
  description: { type: String, trim: true, default: "" },
  invoiceNumber: { type: String, trim: true, default: "" },
  amount: { type: Number, min: 0, required: true },
  currency: { type: String, uppercase: true, trim: true, default: "NGN" },
  invoiceDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  recurrence: { type: String, enum: ["none", "monthly", "quarterly", "annually", "custom"], default: "none" },
  recurrenceRule: { type: String, default: "" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  memo: { type: mongoose.Schema.Types.ObjectId, ref: "Memo", default: null },
  invoiceFile: { type: String, default: "" },
  approvalStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
  paymentStatus: { type: String, enum: ["unpaid", "partially_paid", "processing", "awaiting_verification", "verified", "reconciled", "closed", "overdue", "reversed"], default: "unpaid" },
  assignedFinanceOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  nextOccurrenceAt: { type: Date, default: null },
  auditHistory: [{ action: String, note: String, actor: String, at: { type: Date, default: Date.now } }],
  ...BaseSchema,
}, { timestamps: true, minimize: false });
billSchema.index({ company: 1, reference: 1 }, { unique: true });
billSchema.index({ company: 1, vendor: 1, invoiceNumber: 1 }, { partialFilterExpression: { invoiceNumber: { $type: "string", $gt: "" } } });
export default mongoose.model("Bill", billSchema);
