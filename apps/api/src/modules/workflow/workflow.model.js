import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const workflowSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    businessService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessService",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

   version: {
      type: Number,
      default: 1,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

workflowSchema.index(
  { company: 1, code: 1 },
  { unique: true }
);

export default mongoose.model("Workflow", workflowSchema);