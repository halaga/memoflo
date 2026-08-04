import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    favicon: {
      type: String,
      default: "",
    },

    primaryColor: {
      type: String,
      default: "#2563EB",
    },

    secondaryColor: {
      type: String,
      default: "#1E293B",
    },

    email: String,

    phone: String,

    website: String,

    address: String,

    city: String,

    state: String,

    country: {
      type: String,
      default: "Nigeria",
    },

    timezone: {
      type: String,
      default: "Africa/Lagos",
    },

    industry: String,

    settings: {
      type: Object,
      default: {},
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Company",
  companySchema
);