import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  actorName: { type: String, default: "Employee", trim: true },
  type: { type: String, enum: ["created", "comment", "status", "assignment", "priority", "system"], default: "system" },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  fromStatus: { type: String, default: null },
  toStatus: { type: String, default: null },
  internal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const schema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  ticketNo: { type: String, trim: true, index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessService", default: null },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  details: { type: String, default: "", trim: true, maxlength: 12000 },
  category: { type: String, default: "General", trim: true, index: true },
  priority: { type: String, enum: ["Low", "Normal", "High", "Urgent", "Critical"], default: "Normal", index: true },
  status: { type: String, enum: ["Submitted", "Assigned", "In Progress", "Waiting on Employee", "On Hold", "Completed", "Rejected", "Cancelled"], default: "Submitted", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  activity: { type: [activitySchema], default: [] },
  resolvedAt: { type: Date, default: null },
  ...BaseSchema,
}, { timestamps: true });

schema.index({ company: 1, requester: 1, createdAt: -1 });
schema.index({ company: 1, ticketNo: 1 }, { unique: true, sparse: true });
export default mongoose.model("ServiceRequest", schema);
