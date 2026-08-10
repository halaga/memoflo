import mongoose from "mongoose";
import BaseSchema from "../../../database/BaseSchema.js";

const departmentSchema = new mongoose.Schema(
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
    },

    head: {
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

departmentSchema.index(
  { company: 1, code: 1 },
  { unique: true }
);

export default mongoose.model("Department", departmentSchema);