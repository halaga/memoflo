import mongoose from "mongoose";
import BaseSchema from "../../../database/BaseSchema.js";

const designationSchema =
  new mongoose.Schema(
    {
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      level: {
        type: Number,
        default: 1,
      },

      description: String,

      ...BaseSchema,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Designation",
  designationSchema
);