import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const designationSchema = new mongoose.Schema(
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

designationSchema.index({
  company: 1,
  name: 1,
});

export default mongoose.model(
  "Designation",
  designationSchema
);