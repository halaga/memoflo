import mongoose from "mongoose";
import BaseSchema from "../../../database/BaseSchema.js";

const departmentSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    sbu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SBU",
      default: null,
    },

    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Department",
  departmentSchema
);