import mongoose from "mongoose";

const memoEventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    memo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Memo",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      default: null,
    },
    workflowStep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkflowStep",
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

memoEventSchema.index({ company: 1, memo: 1, createdAt: -1 });

export default mongoose.model("MemoEvent", memoEventSchema);
