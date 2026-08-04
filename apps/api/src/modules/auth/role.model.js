import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

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
        type: String,
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

export default mongoose.model(
  "Role",
  roleSchema
);