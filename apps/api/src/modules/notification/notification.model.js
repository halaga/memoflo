import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const notificationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    type: {
      type: String,
      trim: true,
      default: "system",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    readAt: {
      type: Date,
      default: null,
      index: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  company: 1,
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  company: 1,
  recipient: 1,
  readAt: 1,
  createdAt: -1,
});

export default mongoose.model("Notification", notificationSchema);
