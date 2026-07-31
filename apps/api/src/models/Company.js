import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "Nigeria",
    },

    timezone: {
      type: String,
      default: "Africa/Lagos",
    },

    industry: {
      type: String,
      default: "",
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

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