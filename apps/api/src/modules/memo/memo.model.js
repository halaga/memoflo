import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const memoSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true,
    },
    referenceNo: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
    },
    memoType: {
        type: String,
        enum: ["simple", "approval", "request"],
        default: "simple",
    },
    // Kept for compatibility with records created by the earlier M2 draft.
    submissionType: {
        type: String,
        default: "",
        index: true,
    },
    requisitionType: {
        type: String,
        trim: true,
        default: "",
        index: true,
    },
    submissionDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    businessJustification: { type: String, trim: true, default: "" },
    requiredCompletionDate: { type: Date, default: null },
    financialDetails: {
        required: { type: Boolean, default: false },
        estimatedAmount: { type: Number, min: 0, default: null },
        currency: { type: String, trim: true, default: "NGN" },
        budgetOrCostCentre: { type: String, trim: true, default: "" },
        vendor: { type: String, trim: true, default: "" },
        invoiceNumber: { type: String, trim: true, default: "" },
        quotationDetails: { type: String, trim: true, default: "" },
        paymentRequired: { type: Boolean, default: false },
    },
    ccRecipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    acknowledgementRequired: { type: Boolean, default: false },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    recipients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        }],
    category: {
        type: String,
        default: "General",
    },
    priority: {
        type: String,
        enum: ["Low", "Normal", "High", "Urgent", "Critical"],
        default: "Normal",
    },
    status: {
        type: String,
        enum: [
            "Draft",
            "Pending",
            "In Review",
            "Approved",
            "Rejected",
            "Completed",
            "Cancelled",
        ],
        default: "Draft",
    },
    businessService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessService",
        required: false,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    requestingSbu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SBU",
        default: null,
    },
    beneficiarySBU: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SBU",
        default: null,
    },
    workflow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workflow",
        default: null,
    },
    workflowInstance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkflowInstance",
        default: null,
    },
    currentStep: {
        type: Number,
        default: 0,
    },
    currentApprover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position",
        default: null,
    },
    ...BaseSchema,
}, {
    timestamps: true,
});
export default mongoose.model("Memo", memoSchema);
