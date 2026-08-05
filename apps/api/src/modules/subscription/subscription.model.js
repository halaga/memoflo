import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    priceMonthly: {
      type: Number,
      default: 0,
    },

    priceYearly: {
      type: Number,
      default: 0,
    },

    maxUsers: {
      type: Number,
      default: 10,
    },

    maxStorageGB: {
      type: Number,
      default: 5,
    },

    features: {
      type: [String],
      default: [],
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Subscription",
  subscriptionSchema
);