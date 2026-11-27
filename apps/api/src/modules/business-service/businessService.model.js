import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const formFieldSchema = new mongoose.Schema({
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "textarea", "number", "currency", "date", "select", "multiselect", "checkbox", "file", "user", "department"], default: "text" },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: { type: [String], default: [] },
    helpText: { type: String, default: "", trim: true },
    conditionalOn: { type: String, default: "", trim: true },
    conditionalValue: { type: String, default: "", trim: true },
}, { _id: false });

const businessServiceSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    moduleId: { type: String, default: "", trim: true, index: true },
    actionType: { type: String, default: "service-request", trim: true },
    routeKey: { type: String, default: "", trim: true },
    keywords: { type: [String], default: [] },
    requiresSbu: { type: Boolean, default: false },
    subscriptionFeature: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    ownerDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    responsibleDepartment: { type: String, default: "", trim: true },
    availabilityRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    audienceGroups: { type: [String], default: [] },
    formSchema: { type: [formFieldSchema], default: [] },
    allowedRequisitionTypes: { type: [String], default: [] },
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", default: null },
    requisitionWorkflowMap: { type: mongoose.Schema.Types.Mixed, default: {} },
    icon: { type: String, default: "", trim: true },
    color: { type: String, default: "#2563EB", trim: true },
    requiredAttachments: [{ type: String, trim: true }],
    defaultPriority: { type: String, enum: ["Low", "Normal", "High", "Urgent", "Critical"], default: "Normal" },
    financialRequired: { type: Boolean, default: false },
    paymentRequired: { type: Boolean, default: false },
    inventoryFulfilment: { type: Boolean, default: false },
    slaHours: { type: Number, min: 0, default: null },
    escalationRules: { type: [mongoose.Schema.Types.Mixed], default: [] },
    active: { type: Boolean, default: true },
    catalogueVisible: { type: Boolean, default: true },
    ...BaseSchema,
}, { timestamps: true, minimize: false });

businessServiceSchema.index({ company: 1, slug: 1 }, { unique: true });
export default mongoose.model("BusinessService", businessServiceSchema);
