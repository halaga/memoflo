import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const workflowStepSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true,
    },
    workflow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workflow",
        required: true,
        index: true,
    },
    order: {
        type: Number,
        required: true,
        min: 1,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    action: {
        type: String,
        enum: [
            "submit",
            "minute",
            "approve",
            "reject",
            "forward",
            "review",
            "complete",
            "archive",
            "cancel",
            "reopen",
            "resubmit",
            "pay",
            "receive",
            "acknowledge",
        ],
        required: true,
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position",
        default: null,
    },
    required: {
        type: Boolean,
        default: true,
    },
    allowDelegate: {
        type: Boolean,
        default: false,
    },
    ...BaseSchema,
}, {
    timestamps: true,
});
workflowStepSchema.index({
    company: 1,
    workflow: 1,
    order: 1
}, { unique: true });
export default mongoose.model("WorkflowStep", workflowStepSchema);
