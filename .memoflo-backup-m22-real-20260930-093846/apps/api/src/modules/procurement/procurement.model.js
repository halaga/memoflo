import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const procurementItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, default: "item", trim: true },
    estimatedUnitCost: { type: Number, default: 0, min: 0 },
    estimatedTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const participantSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const procurementSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    requestNo: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    requestingSbu: { type: mongoose.Schema.Types.ObjectId, ref: "SBU", required: true },
    category: { type: String, default: "General", trim: true },
    urgency: { type: String, enum: ["Normal", "Urgent", "Critical"], default: "Normal" },
    neededBy: { type: Date, default: null },
    currency: { type: String, default: "NGN", uppercase: true, trim: true },
    estimatedAmount: { type: Number, default: 0, min: 0 },
    items: { type: [procurementItemSchema], default: [] },
    stage: {
      type: String,
      enum: [
        "PENDING_SBU_HEAD",
        "PENDING_ADMIN",
        "PENDING_ICC",
        "PENDING_SBU_FINANCE",
        "PENDING_CEO",
        "PENDING_PAYMENT",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING_SBU_HEAD",
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    currentHandler: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    participants: {
      requestingSbuHead: participantSchema,
      adminDispatcher: participantSchema,
      iccEvaluator: participantSchema,
      sbuFinanceApprover: participantSchema,
      ceoApprover: participantSchema,
    },
    sbuHeadMinute: { type: String, default: "", trim: true },
    sbuHeadActionAt: { type: Date, default: null },
    dispatchedAt: { type: Date, default: null },
    iccEvaluation: {
      vendor: { type: String, default: "", trim: true },
      quotedAmount: { type: Number, default: 0, min: 0 },
      quoteReference: { type: String, default: "", trim: true },
      recommendation: { type: String, default: "", trim: true },
      evaluatedAt: { type: Date, default: null },
      evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    },
    financeApproval: {
      amountApproved: { type: Number, default: 0, min: 0 },
      comment: { type: String, default: "", trim: true },
      approvedAt: { type: Date, default: null },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    },
    ceoApproval: {
      approvedAt: { type: Date, default: null },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      comment: { type: String, default: "", trim: true },
    },
    payment: {
      amount: { type: Number, default: 0, min: 0 },
      reference: { type: String, default: "", trim: true },
      note: { type: String, default: "", trim: true },
      paidAt: { type: Date, default: null },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    },
    rejection: {
      reason: { type: String, default: "", trim: true },
      rejectedAt: { type: Date, default: null },
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    },
    ...BaseSchema,
  },
  { timestamps: true }
);

procurementSchema.index({ company: 1, requestNo: 1 }, { unique: true });
procurementSchema.index({ company: 1, requester: 1, createdAt: -1 });
procurementSchema.index({ company: 1, currentHandler: 1, stage: 1 });

export default mongoose.model("ProcurementRequest", procurementSchema);
