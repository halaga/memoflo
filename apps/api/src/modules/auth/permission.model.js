import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    module: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    isSystem: {
      type: Boolean,
      default: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Permission",
  permissionSchema
);