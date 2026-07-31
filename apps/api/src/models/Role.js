import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const roleSchema = new mongoose.Schema(
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

    level: {
      type: Number,
      default: 1,
    },

    description: {
      type: String,
      default: "",
    },

    permissions: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
  },
],

    isSystem: {
      type: Boolean,
      default: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

roleSchema.index({
  company: 1,
  name: 1,
});

export default mongoose.model(
  "Role",
  roleSchema
);