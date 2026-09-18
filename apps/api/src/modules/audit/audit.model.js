import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    method: {
      type: String,
      default: null,
      uppercase: true,
    },
    path: {
      type: String,
      default: null,
      trim: true,
    },
    outcome: {
      type: String,
      enum: ["success", "failure"],
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

auditLogSchema.index({ company: 1, occurredAt: -1 });
auditLogSchema.index({ company: 1, actor: 1, occurredAt: -1 });
auditLogSchema.index({ company: 1, resourceType: 1, resourceId: 1, occurredAt: -1 });
auditLogSchema.index({ company: 1, action: 1, occurredAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
