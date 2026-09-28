import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const leaveBalanceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true, index: true },
    year: { type: Number, required: true, index: true },
    allocated: { type: Number, min: 0, default: 0 },
    used: { type: Number, min: 0, default: 0 },
    pending: { type: Number, min: 0, default: 0 },
    ...BaseSchema,
  },
  { timestamps: true }
);

leaveBalanceSchema.index(
  { company: 1, employee: 1, leaveType: 1, year: 1 },
  { unique: true }
);

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
