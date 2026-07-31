import mongoose from "mongoose";

const BaseSchema = {
  status: {
    type: String,
    enum: [
      "ACTIVE",
      "INACTIVE",
      "ARCHIVED",
    ],
    default: "ACTIVE",
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  deletedAt: {
    type: Date,
    default: null,
  },
};

export default BaseSchema;