import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const businessServiceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    ownerDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },

    icon: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      default: "#2563EB",
      trim: true,
    },

    requiredAttachments: [
      {
        type: String,
        trim: true,
      },
    ],

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

businessServiceSchema.index(
  {
    company: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "BusinessService",
  businessServiceSchema
);