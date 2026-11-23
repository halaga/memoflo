import BusinessService from "./businessService.model.js";
import Department from "../organization/department/department.model.js";

const RINGO_CATALOGUE = [
    { name: "Office Drinking Water", category: "Admin", owner: "Administration", slug: "office-drinking-water", icon: "droplet", color: "#0EA5E9", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["water", "drinking water", "office"], financialRequired: true },
    { name: "Fine & Levy", category: "Admin", owner: "Administration", slug: "admin-fine-levy", icon: "receipt", color: "#D97706", allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"], keywords: ["fine", "levy", "regulatory"], financialRequired: true, paymentRequired: true },
    { name: "Utility", category: "Admin", owner: "Administration", slug: "utility", icon: "zap", color: "#EAB308", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["utility", "electricity", "power", "water"], financialRequired: true, paymentRequired: true },
    { name: "Facility Management", category: "Admin", owner: "Administration", slug: "facility-management", icon: "building", color: "#64748B", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["facility", "maintenance", "building"] },
    { name: "Office Supplies", category: "Admin", owner: "Administration", slug: "office-supplies", icon: "package", color: "#8B5CF6", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["stationery", "supplies", "office"], inventoryFulfilment: true },
    { name: "Sanitation", category: "Admin", owner: "Administration", slug: "sanitation", icon: "sparkles", color: "#14B8A6", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["cleaning", "sanitation", "hygiene"] },
    { name: "Budget", category: "SBU", owner: "Administration", slug: "sbu-budget", icon: "chart", color: "#0F766E", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["budget", "allocation"], requiresSbu: true, financialRequired: true },
    { name: "Unit Admin Expenses", category: "SBU", owner: "Administration", slug: "unit-admin-expenses", icon: "wallet", color: "#059669", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["unit", "admin", "expense"], requiresSbu: true, financialRequired: true },
    { name: "Rent", category: "SBU", owner: "Administration", slug: "sbu-rent", icon: "building", color: "#6366F1", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["rent", "lease", "premises"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "Laptop / Computer Request", category: "IT", owner: "Information Technology", slug: "laptop-computer-request", icon: "laptop", color: "#2563EB", allowedRequisitionTypes: ["IT Requisition"], keywords: ["laptop", "computer", "hardware"] },
    { name: "IT Equipment", category: "IT", owner: "Information Technology", slug: "it-equipment", icon: "monitor", color: "#2563EB", allowedRequisitionTypes: ["IT Requisition"], keywords: ["equipment", "device"] },
    { name: "Software and Subscriptions", category: "IT", owner: "Information Technology", slug: "software-subscriptions", icon: "code", color: "#7C3AED", allowedRequisitionTypes: ["IT Requisition"], keywords: ["software", "subscription", "licence"] },
    { name: "Network and Internet", category: "IT", owner: "Information Technology", slug: "network-internet", icon: "wifi", color: "#0891B2", allowedRequisitionTypes: ["IT Requisition"], keywords: ["network", "internet", "connectivity"] },
    { name: "Repairs and Maintenance", category: "IT", owner: "Information Technology", slug: "it-repairs-maintenance", icon: "wrench", color: "#D97706", allowedRequisitionTypes: ["IT Requisition"], keywords: ["repair", "maintenance"] },
    { name: "IT Consumables", category: "IT", owner: "Information Technology", slug: "it-consumables", icon: "package", color: "#0D9488", allowedRequisitionTypes: ["IT Requisition"], keywords: ["consumables", "toner", "cables"] },
    { name: "Other IT Requests", category: "IT", owner: "Information Technology", slug: "other-it-requests", icon: "settings", color: "#64748B", allowedRequisitionTypes: ["IT Requisition"], keywords: ["it", "other"] },
];

export async function seedBusinessServices(company) {
    // Ringo is the pilot tenant; its catalogue must never leak into other tenants.
    if (String(company?.code || "").toUpperCase() !== "RINGO") return;
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
            { $setOnInsert: data, $set: { category: entry.category, active: true, moduleId: "memos", actionType: "service-request", routeKey: "memo-composer", description: data.description, ownerDepartment: data.ownerDepartment, responsibleDepartment: data.responsibleDepartment, requiresSbu: Boolean(entry.requiresSbu), financialRequired: Boolean(entry.financialRequired), paymentRequired: Boolean(entry.paymentRequired), inventoryFulfilment: Boolean(entry.inventoryFulfilment), allowedRequisitionTypes: entry.allowedRequisitionTypes || [], icon: entry.icon || "services", color: entry.color || "#2563EB" } },
            { upsert: true },
        );
    }

    // Consolidate the previous duplicate SBU Fine & Levy catalogue card. Historical
    // memos keep their original service reference; the canonical Admin Fine & Levy
    // entry supports both Admin and SBU Requisition types.
    await BusinessService.updateOne(
        { company: company._id, slug: "admin-fine-levy", active: true },
        { $set: { allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"] } },
    );
    await BusinessService.updateOne(
        { company: company._id, slug: "sbu-fine-levy", active: true },
        { $set: { active: false } },
    );

    // Legacy services remain available; transaction-specific routing is migrated to the unified composer.
    await BusinessService.updateMany(
        { company: company._id, active: true, actionType: { $in: ["procurement", "service-request"] } },
        { $set: { actionType: "service-request", routeKey: "memo-composer", moduleId: "memos" } },
    );
}
