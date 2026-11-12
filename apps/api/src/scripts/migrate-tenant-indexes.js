import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Employee from "../modules/employee/employee.model.js";
import WorkflowStep from "../modules/workflow/workflowStep.model.js";
import "../modules/workflow/workflow.model.js";
const CONFIRMATION = "MEMOFLO_CONFIRM_TENANT_INDEX_MIGRATION";
function isSingleFieldUniqueIndex(index, field) {
    const entries = Object.entries(index.key || {});
    return index.unique === true && entries.length === 1 && entries[0][0] === field && entries[0][1] === 1;
}
async function main() {
    if (process.env[CONFIRMATION] !== "true") {
        throw new Error(`Refusing to modify indexes. Set ${CONFIRMATION}=true after reviewing the migration instructions.`);
    }
    if (!process.env.MONGO_URI)
        throw new Error("MONGO_URI is required.");
    await mongoose.connect(process.env.MONGO_URI);
    const collection = Employee.collection;
    const indexes = await collection.listIndexes().toArray();
    // Preflight workflow-step ownership before making any index or data changes.
    const legacySteps = await WorkflowStep.find({
        $or: [{ company: null }, { company: { $exists: false } }],
    }).populate({
        path: "workflow",
        select: "company"
    });
    const stepUpdates = [];
    const orphanStepIds = [];
    for (const step of legacySteps) {
        const companyId = step.workflow?.company;
        if (!companyId) {
            orphanStepIds.push(String(step._id));
            continue;
        }
        stepUpdates.push({
            updateOne: {
                filter: {
                    _id: step._id,
                    workflow: step.workflow._id
                },
                update: { $set: { company: companyId } },
            },
        });
    }
    if (orphanStepIds.length) {
        throw new Error(`Cannot safely backfill ${orphanStepIds.length} workflow step(s) because their parent workflow is missing or has no company. IDs: ${orphanStepIds.slice(0, 20).join(", ")}`);
    }
    // Backfill is non-destructive and runs only after all legacy references pass preflight.
    if (stepUpdates.length) {
        await WorkflowStep.bulkWrite(stepUpdates, { ordered: true });
        console.log(`Backfilled company ownership on ${stepUpdates.length} workflow step(s).`);
    }
    // Drop only the exact legacy single-field unique indexes after preflight/backfill.
    for (const field of ["email", "employeeNo"]) {
        const legacy = indexes.filter((index) => isSingleFieldUniqueIndex(index, field));
        for (const index of legacy) {
            if (index.name === "_id_")
                continue;
            console.log(`Dropping legacy global unique index: ${index.name}`);
            await collection.dropIndex(index.name);
        }
    }
await WorkflowStep.collection.createIndex({
    company: 1,
    workflow: 1,
    order: 1
}, {
    unique: true,
    name: "uniq_workflow_step_company_workflow_order"
});
    await collection.createIndex({
        company: 1,
        email: 1
    }, {
        unique: true,
        name: "uniq_employee_company_email"
    });
await collection.createIndex({
    company: 1,
    employeeNo: 1
}, {
    unique: true,
    name: "uniq_employee_company_employee_no"
});
    console.log("Tenant-scoped employee and workflow-step indexes are ready.");
    console.log("Existing employee documents were not modified or deleted.");
}
main()
    .catch((error) => {
    console.error("Tenant employee index migration failed:", error.message);
    process.exitCode = 1;
})
    .finally(async () => {
    await mongoose.disconnect();
});
