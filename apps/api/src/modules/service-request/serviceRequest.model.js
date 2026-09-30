import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const schema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessService", default: null },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  title: { type: String, required: true, trim: true },
  details: { type: String, default: "", trim: true },
  category: { type: String, default: "General", trim: true },
  priority: { type: String, enum: ["Low", "Normal", "High", "Urgent"], default: "Normal" },
  status: { type: String, enum: ["Submitted", "In Progress", "Completed", "Rejected", "Cancelled"], default: "Submitted", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ...BaseSchema,
}, { timestamps: true });

schema.index({ company: 1, requester: 1, createdAt: -1 });
export default mongoose.model("ServiceRequest", schema);
