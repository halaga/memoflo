const FIELD_TYPES = new Set(["text", "textarea", "number", "date", "select", "checkbox"]);
const PRIORITIES = new Set(["Low", "Normal", "High", "Urgent", "Critical"]);

export function validateCreateBusinessService(payload) {
    if (!payload.name?.trim()) throw new Error("Business service name is required");
    if (!payload.slug?.trim()) throw new Error("Business service slug is required");
    if (!payload.category?.trim()) throw new Error("Business service category is required");
    if (!payload.ownerDepartment) throw new Error("Owner department is required");
    if (payload.defaultPriority && !PRIORITIES.has(payload.defaultPriority)) throw new Error("Invalid default priority");
    if (payload.allowedRequisitionTypes !== undefined) {
        if (!Array.isArray(payload.allowedRequisitionTypes)) {
            throw new Error("Allowed requisition types must be a list");
        }
        const normalizedTypes = payload.allowedRequisitionTypes.map((value) => String(value || "").trim());
        if (normalizedTypes.some((value) => !value)) {
            throw new Error("Requisition type names cannot be empty");
        }
        if (new Set(normalizedTypes).size !== normalizedTypes.length) {
            throw new Error("Duplicate allowed requisition type");
        }
    }
    if (payload.slaHours !== undefined && payload.slaHours !== null && (!Number.isFinite(Number(payload.slaHours)) || Number(payload.slaHours) < 0)) {
        throw new Error("SLA hours must be a non-negative number");
    }
    if (payload.formSchema !== undefined) {
        if (!Array.isArray(payload.formSchema)) throw new Error("Service form schema must be a list");
        const keys = new Set();
        for (const field of payload.formSchema) {
            if (!field.key?.trim() || !field.label?.trim()) throw new Error("Every service form field needs a key and label");
            if (!FIELD_TYPES.has(field.type || "text")) throw new Error(`Unsupported field type: ${field.type}`);
            if (keys.has(field.key)) throw new Error(`Duplicate service form field: ${field.key}`);
            keys.add(field.key);
            if (field.type === "select" && (!Array.isArray(field.options) || !field.options.length)) {
                throw new Error(`Select field ${field.label} needs at least one option`);
            }
        }
    }
}
