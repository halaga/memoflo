import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const userSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    employeeId: String,

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: String,

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    sbu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SBU",
    },

    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },

    avatar: String,

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
      ],
      default: "ACTIVE",
    },

    lastLogin: Date,

    ...BaseSchema,
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model(
  "User",
  userSchema
);