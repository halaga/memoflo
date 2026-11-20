import test from "node:test";
import assert from "node:assert/strict";
import { validateCreateBusinessService } from "../src/modules/business-service/businessService.validator.js";

const validService = {
    name: "Office Supplies",
    slug: "office-supplies",
    category: "Admin",
    ownerDepartment: "department-id",
};

test("accepts a valid tenant service definition", () => {
    assert.doesNotThrow(() => validateCreateBusinessService(validService));
});

test("requires service name, slug, category and owner", () => {
    for (const key of ["name", "slug", "category", "ownerDepartment"]) {
        const payload = { ...validService, [key]: "" };
        assert.throws(() => validateCreateBusinessService(payload));
    }
});

test("validates dynamic form field keys and types", () => {
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        formSchema: [{ key: "", label: "Location", type: "text" }],
    }), /key and label/);
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        formSchema: [{ key: "location", label: "Location", type: "file-upload" }],
    }), /Unsupported field type/);
});

test("requires options for select fields and rejects duplicate keys", () => {
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        formSchema: [{ key: "type", label: "Type", type: "select", options: [] }],
    }), /at least one option/);
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        formSchema: [
            { key: "location", label: "Location", type: "text" },
            { key: "location", label: "Office", type: "text" },
        ],
    }), /Duplicate service form field/);
});

test("validates SLA and default priority", () => {
    assert.throws(() => validateCreateBusinessService({ ...validService, slaHours: -1 }), /non-negative/);
    assert.throws(() => validateCreateBusinessService({ ...validService, defaultPriority: "Immediate" }), /priority/);
});

test("accepts multiple requisition types and workflow mappings", () => {
    assert.doesNotThrow(() => validateCreateBusinessService({
        ...validService,
        allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"],
        requisitionWorkflowMap: {
            "Admin Requisition": "workflow-admin",
            "SBU Requisition": "workflow-sbu",
        },
    }));
});

test("rejects duplicate or empty requisition type values", () => {
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        allowedRequisitionTypes: ["Admin Requisition", "Admin Requisition"],
    }), /Duplicate/);
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        allowedRequisitionTypes: [""],
    }), /cannot be empty/);
});

test("supports multi-select fields and requires configured options", () => {
    assert.doesNotThrow(() => validateCreateBusinessService({
        ...validService,
        formSchema: [{ key: "locations", label: "Locations", type: "multiselect", options: ["Lagos", "Abuja"] }],
    }));
    assert.throws(() => validateCreateBusinessService({
        ...validService,
        formSchema: [{ key: "locations", label: "Locations", type: "multiselect", options: [] }],
    }), /at least one option/);
});
