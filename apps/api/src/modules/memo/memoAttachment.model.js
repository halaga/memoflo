import mongoose from "mongoose";

const memoAttachmentSchema = new mongoose.Schema(
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      unique: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

memoAttachmentSchema.index({ company: 1, memo: 1, createdAt: -1 });

export default mongoose.model("MemoAttachment", memoAttachmentSchema);
