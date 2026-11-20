import BusinessService from "./businessService.model.js";
import Department from "../organization/department/department.model.js";

const RINGO_CATALOGUE = [
    { name: "Office Drinking Water", category: "Admin", owner: "Administration", slug: "office-drinking-water", keywords: ["water", "drinking water", "office"], financialRequired: true },
    { name: "Fine & Levy", category: "Admin", owner: "Administration", slug: "admin-fine-levy", keywords: ["fine", "levy", "regulatory"], financialRequired: true, paymentRequired: true },
    { name: "Utility", category: "Admin", owner: "Administration", slug: "utility", keywords: ["utility", "electricity", "power", "water"], financialRequired: true, paymentRequired: true },
    { name: "Facility Management", category: "Admin", owner: "Administration", slug: "facility-management", keywords: ["facility", "maintenance", "building"] },
    { name: "Office Supplies", category: "Admin", owner: "Administration", slug: "office-supplies", keywords: ["stationery", "supplies", "office"], inventoryFulfilment: true },
    { name: "Sanitation", category: "Admin", owner: "Administration", slug: "sanitation", keywords: ["cleaning", "sanitation", "hygiene"] },
    { name: "Budget", category: "SBU", owner: "Administration", slug: "sbu-budget", keywords: ["budget", "allocation"], requiresSbu: true, financialRequired: true },
    { name: "Unit Admin Expenses", category: "SBU", owner: "Administration", slug: "unit-admin-expenses", keywords: ["unit", "admin", "expense"], requiresSbu: true, financialRequired: true },
    { name: "Rent", category: "SBU", owner: "Administration", slug: "sbu-rent", keywords: ["rent", "lease", "premises"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "Fine & Levy", category: "SBU", owner: "Administration", slug: "sbu-fine-levy", keywords: ["fine", "levy"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "IT Support", category: "IT", owner: "Information Technology", slug: "it-support", keywords: ["it", "support", "technical", "repair"] },
    { name: "IT Maintenance", category: "IT", owner: "Information Technology", slug: "it-maintenance", keywords: ["it", "maintenance", "hardware"] },
];

export async function seedBusinessServices(company) {
    const departments = await Department.find({ company: company._id, isActive: true });
    const findDepartment = (name) => departments.find((department) => department.name.toLowerCase() === name.toLowerCase());

    for (const entry of RINGO_CATALOGUE) {
        const ownerDepartment = findDepartment(entry.owner);
        if (!ownerDepartment) {
            console.warn(`Skipping ${entry.name}: ${entry.owner} department not found`);
            continue;
        }
        const { owner, ...service } = entry;
        const data = {
            ...service,
            company: company._id,
            ownerDepartment: ownerDepartment._id,
            responsibleDepartment: owner,
            moduleId: "memos",
            actionType: "service-request",
            routeKey: "memo-composer",
            description: `${entry.name} request submitted through the company memo and approval process.`,
            defaultPriority: "Normal",
            active: true,
        };
        await BusinessService.updateOne(
            { company: company._id, slug: entry.slug },
            { $setOnInsert: data, $set: { category: entry.category, active: true } },
            { upsert: true },
        );
    }

    // Legacy services remain available; transaction-specific routing is migrated to the unified composer.
    await BusinessService.updateMany(
        { company: company._id, active: true, actionType: { $in: ["procurement", "service-request"] } },
        { $set: { actionType: "service-request", routeKey: "memo-composer", moduleId: "memos" } },
    );
}
