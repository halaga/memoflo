import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "",
    },

    route: {
      type: String,
      default: "",
    },

    version: {
      type: String,
      default: "1.0.0",
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Module",
  moduleSchema
);