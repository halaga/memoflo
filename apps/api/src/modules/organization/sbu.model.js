import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const sbuSchema = new mongoose.Schema(
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
      trim: true,
    },

    description: {
      type: String,
      default: "",
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

sbuSchema.index({
  company: 1,
  name: 1,
});

export default mongoose.model(
  "SBU",
  sbuSchema
);