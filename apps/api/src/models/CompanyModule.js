import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const companyModuleSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    configuration: {
      type: Object,
      default: {},
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

companyModuleSchema.index(
  {
    company: 1,
    module: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "CompanyModule",
  companyModuleSchema
);