import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const paymentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true, index: true },
  amount: { type: Number, min: 0.01, required: true },
  currency: { type: String, uppercase: true, trim: true, default: "NGN" },
  paymentDate: { type: Date, required: true },
  reference: { type: String, trim: true, required: true },
  method: { type: String, enum: ["bank_transfer", "cheque", "cash", "card", "other"], default: "bank_transfer" },
  evidence: { type: String, default: "" },
  status: { type: String, enum: ["recorded", "awaiting_verification", "verified", "rejected", "reversed", "reconciled"], default: "recorded" },
  verifiedBy: { type: String, default: "" },
  verifiedAt: { type: Date, default: null },
  reconciledBy: { type: String, default: "" },
  reconciledAt: { type: Date, default: null },
  rejectionReason: { type: String, default: "" },
  reversalReason: { type: String, default: "" },
  auditHistory: [{ action: String, note: String, actor: String, at: { type: Date, default: Date.now } }],
  ...BaseSchema,
}, { timestamps: true, minimize: false });
paymentSchema.index({ company: 1, reference: 1 }, { unique: true });
export default mongoose.model("Payment", paymentSchema);
