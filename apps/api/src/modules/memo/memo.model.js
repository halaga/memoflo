import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const memoSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    referenceNo: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Critical"],
      default: "Normal",
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "In Review",
        "Approved",
        "Rejected",
        "Completed",
      ],
      default: "Draft",
    },

    businessService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessService",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    requestingSBU: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SBU",
      required: true,
    },

    beneficiarySBU: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SBU",
      default: null,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },

    currentStep: {
      type: Number,
      default: 0,
    },

    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
    ],

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Memo", memoSchema);