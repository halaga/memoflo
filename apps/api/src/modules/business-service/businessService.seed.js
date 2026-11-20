import BusinessService from "./businessService.model.js";
import Department from "../organization/department/department.model.js";

const RINGO_CATALOGUE = [
    { name: "Office Drinking Water", category: "Admin", owner: "Administration", slug: "office-drinking-water", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["water", "drinking water", "office"], financialRequired: true },
    { name: "Fine & Levy", category: "Admin", owner: "Administration", slug: "admin-fine-levy", allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"], keywords: ["fine", "levy", "regulatory"], financialRequired: true, paymentRequired: true },
    { name: "Utility", category: "Admin", owner: "Administration", slug: "utility", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["utility", "electricity", "power", "water"], financialRequired: true, paymentRequired: true },
    { name: "Facility Management", category: "Admin", owner: "Administration", slug: "facility-management", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["facility", "maintenance", "building"] },
    { name: "Office Supplies", category: "Admin", owner: "Administration", slug: "office-supplies", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["stationery", "supplies", "office"], inventoryFulfilment: true },
    { name: "Sanitation", category: "Admin", owner: "Administration", slug: "sanitation", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["cleaning", "sanitation", "hygiene"] },
    { name: "Budget", category: "SBU", owner: "Administration", slug: "sbu-budget", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["budget", "allocation"], requiresSbu: true, financialRequired: true },
    { name: "Unit Admin Expenses", category: "SBU", owner: "Administration", slug: "unit-admin-expenses", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["unit", "admin", "expense"], requiresSbu: true, financialRequired: true },
    { name: "Rent", category: "SBU", owner: "Administration", slug: "sbu-rent", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["rent", "lease", "premises"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "Fine & Levy", category: "SBU", owner: "Administration", slug: "sbu-fine-levy", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["fine", "levy"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "Laptop / Computer Request", category: "IT", owner: "Information Technology", slug: "laptop-computer-request", allowedRequisitionTypes: ["IT Requisition"], keywords: ["laptop", "computer", "hardware"] },
    { name: "IT Equipment", category: "IT", owner: "Information Technology", slug: "it-equipment", allowedRequisitionTypes: ["IT Requisition"], keywords: ["equipment", "device"] },
    { name: "Software and Subscriptions", category: "IT", owner: "Information Technology", slug: "software-subscriptions", allowedRequisitionTypes: ["IT Requisition"], keywords: ["software", "subscription", "licence"] },
    { name: "Network and Internet", category: "IT", owner: "Information Technology", slug: "network-internet", allowedRequisitionTypes: ["IT Requisition"], keywords: ["network", "internet", "connectivity"] },
    { name: "Repairs and Maintenance", category: "IT", owner: "Information Technology", slug: "it-repairs-maintenance", allowedRequisitionTypes: ["IT Requisition"], keywords: ["repair", "maintenance"] },
    { name: "IT Consumables", category: "IT", owner: "Information Technology", slug: "it-consumables", allowedRequisitionTypes: ["IT Requisition"], keywords: ["consumables", "toner", "cables"] },
    { name: "Other IT Requests", category: "IT", owner: "Information Technology", slug: "other-it-requests", allowedRequisitionTypes: ["IT Requisition"], keywords: ["it", "other"] },
];

export async function seedBusinessServices(company) {
    const departments = await Department.find({ company: company._id, isActive: true });
    const findDepartment = (name) => {
        const normalized = name.toLowerCase();
        const aliases = normalized === "information technology" ? ["information technology", "it"] : [normalized];
        return departments.find((department) => aliases.includes(department.name.toLowerCase()));
    };

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
            { $setOnInsert: data, $set: { category: entry.category, active: true, moduleId: "memos", actionType: "service-request", routeKey: "memo-composer", description: data.description, ownerDepartment: data.ownerDepartment, responsibleDepartment: data.responsibleDepartment, requiresSbu: Boolean(entry.requiresSbu), financialRequired: Boolean(entry.financialRequired), paymentRequired: Boolean(entry.paymentRequired), inventoryFulfilment: Boolean(entry.inventoryFulfilment), allowedRequisitionTypes: entry.allowedRequisitionTypes || [] } },
            { upsert: true },
        );
    }

    // Legacy services remain available; transaction-specific routing is migrated to the unified composer.
    await BusinessService.updateMany(
        { company: company._id, active: true, actionType: { $in: ["procurement", "service-request"] } },
        { $set: { actionType: "service-request", routeKey: "memo-composer", moduleId: "memos" } },
    );
}
