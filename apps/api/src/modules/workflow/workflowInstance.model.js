import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const workflowInstanceSchema = new mongoose.Schema({
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
    workflowVersion: {
        type: Number,
        default: 1,
        min: 1,
    },
    resourceType: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    currentStep: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkflowStep",
        default: null,
    },
    currentPosition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position",
        default: null,
    },
    currentEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    status: {
        type: String,
        enum: [
            "pending",
            "running",
            "completed",
            "rejected",
            "cancelled",
        ],
        default: "pending",
        index: true,
    },
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    startedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    assignmentHistory: [{
        action: { type: String, enum: ["delegate", "reassign"], required: true },
        fromEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        toEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        reason: { type: String, default: "", trim: true, maxlength: 1000 },
        occurredAt: { type: Date, default: Date.now },
    }],
    ...BaseSchema,
}, {
    timestamps: true,
});
// Only one pending/running instance may exist for a resource in a tenant.
// Rejected/cancelled history can coexist with a later resubmission.
workflowInstanceSchema.index(
    { company: 1, resourceType: 1, resourceId: 1 },
    {
        unique: true,
        name: "active_workflow_resource_unique",
        partialFilterExpression: {
            status: { $in: ["pending", "running"] },
            isActive: true,
            deletedAt: null,
        },
    },
);
export default mongoose.model("WorkflowInstance", workflowInstanceSchema);
