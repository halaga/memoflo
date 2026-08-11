import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const workflowInstanceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    currentStep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkflowStep",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "completed",
        "rejected",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

workflowInstanceSchema.index({
  company: 1,
  resourceType: 1,
  resourceId: 1,
});

export default mongoose.model(
  "WorkflowInstance",
  workflowInstanceSchema
);