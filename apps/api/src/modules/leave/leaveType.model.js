import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const leaveTypeSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    daysPerYear: { type: Number, required: true, min: 0, default: 0 },
    paid: { type: Boolean, default: true },
    carryForward: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    ...BaseSchema,
  },
  { timestamps: true }
);

leaveTypeSchema.index({ company: 1, code: 1 }, { unique: true });

export default mongoose.model("LeaveType", leaveTypeSchema);
