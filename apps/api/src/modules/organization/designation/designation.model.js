import mongoose from "mongoose";
import BaseSchema from "../../../database/BaseSchema.js";

const designationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    sbu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SBU",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: Number,
      default: 1,
    },

    description: {
      type: String,
      default: "",
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

designationSchema.index(
  {
    company: 1,
    department: 1,
    title: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "Designation",
  designationSchema
);