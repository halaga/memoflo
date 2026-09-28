import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const leaveRequestSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, trim: true, maxlength: 4000, default: "" },
    durationMode: { type: String, enum: ["dates", "custom"], default: "dates" },
    customDays: { type: Number, min: 0.5, max: 365, default: null },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Approved", "HR Filed", "Rejected", "Cancelled"],
      default: "Pending",
      index: true,
    },
    approvalStage: {
      type: String,
      enum: ["SUPERVISOR", "SBU_HEAD", "HR"],
      default: "SUPERVISOR",
      index: true,
    },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    sbuHead: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    supervisorDecisionAt: { type: Date, default: null },
    sbuHeadDecisionAt: { type: Date, default: null },
    decisionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    decisionAt: { type: Date, default: null },
    decisionComment: { type: String, trim: true, maxlength: 4000, default: null },
    ...BaseSchema,
  },
  { timestamps: true }
);

leaveRequestSchema.index({ company: 1, employee: 1, createdAt: -1 });
leaveRequestSchema.index({ company: 1, approver: 1, status: 1, createdAt: -1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
