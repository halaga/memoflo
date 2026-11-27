import BusinessService from "./businessService.model.js";
import Department from "../organization/department/department.model.js";

const RINGO_CATALOGUE = [
    { name: "Office Drinking Water", category: "Admin", owner: "Administration", slug: "office-drinking-water", icon: "droplet", color: "#0EA5E9", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["water", "drinking water", "office"], financialRequired: true },
    { name: "Fine & Levy", category: "Admin", owner: "Administration", slug: "admin-fine-levy", icon: "receipt", color: "#D97706", allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"], keywords: ["fine", "levy", "regulatory"], financialRequired: true, paymentRequired: true },
    { name: "Utility", category: "Admin", owner: "Administration", slug: "utility", icon: "zap", color: "#EAB308", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["utility", "electricity", "power", "water"], financialRequired: true, paymentRequired: true },
    { name: "Facility Management", category: "Admin", owner: "Administration", slug: "facility-management", icon: "building", color: "#64748B", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["facility", "maintenance", "building"] },
    { name: "Office Supplies", category: "Admin", owner: "Administration", slug: "office-supplies", icon: "package", color: "#8B5CF6", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["stationery", "supplies", "office"], inventoryFulfilment: true },
    { name: "Sanitation", category: "Admin", owner: "Administration", slug: "sanitation", icon: "sparkles", color: "#14B8A6", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["cleaning", "sanitation", "hygiene"] },
    { name: "Electricity and Utility Bills", category: "Admin", owner: "Administration", slug: "electricity-utility-bills", icon: "zap", color: "#EAB308", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["electricity", "utility", "power bill"], financialRequired: true, paymentRequired: true, requiredAttachments: ["Utility invoice or bill"], formSchema: [{ key: "accountNumber", label: "Account / Meter Number", type: "text", required: true }, { key: "billingPeriod", label: "Billing Period", type: "text", required: true }, { key: "vendor", label: "Service Provider", type: "text", required: true }] },
    { name: "Internet and Telecommunications Bills", category: "Admin", owner: "Administration", slug: "internet-telecommunications-bills", icon: "wifi", color: "#0891B2", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["internet", "telecom", "data", "connectivity bill"], financialRequired: true, paymentRequired: true, requiredAttachments: ["Internet or telecommunications invoice"], formSchema: [{ key: "accountNumber", label: "Account Number", type: "text", required: true }, { key: "billingPeriod", label: "Billing Period", type: "text", required: true }, { key: "vendor", label: "Service Provider", type: "text", required: true }] },
    { name: "Facility and Maintenance Bills", category: "Admin", owner: "Administration", slug: "facility-maintenance-bills", icon: "wrench", color: "#64748B", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["facility", "maintenance bill", "repairs"], financialRequired: true, paymentRequired: true, requiredAttachments: ["Vendor invoice or quotation"], formSchema: [{ key: "vendor", label: "Vendor / Service Provider", type: "text", required: true }, { key: "workDescription", label: "Work / Service Description", type: "textarea", required: true }] },
    { name: "Vendor Invoices", category: "Admin", owner: "Administration", slug: "vendor-invoices", icon: "file-text", color: "#7C3AED", allowedRequisitionTypes: ["Admin Requisition", "SBU Requisition"], keywords: ["vendor", "invoice", "supplier"], financialRequired: true, paymentRequired: true, requiredAttachments: ["Vendor invoice"], formSchema: [{ key: "vendor", label: "Vendor / Supplier", type: "text", required: true }, { key: "invoiceNumber", label: "Invoice Number", type: "text", required: true }, { key: "invoiceDate", label: "Invoice Date", type: "date", required: true }, { key: "dueDate", label: "Due Date", type: "date", required: false }] },
    { name: "Recurring Company Bills", category: "Admin", owner: "Administration", slug: "recurring-company-bills", icon: "repeat", color: "#0F766E", allowedRequisitionTypes: ["Admin Requisition"], keywords: ["recurring", "monthly bill", "quarterly bill"], financialRequired: true, paymentRequired: true, formSchema: [{ key: "vendor", label: "Vendor / Service Provider", type: "text", required: true }, { key: "recurrence", label: "Recurrence Frequency", type: "select", options: ["Monthly", "Quarterly", "Annually", "Custom"], required: true }, { key: "nextDueDate", label: "Next Due Date", type: "date", required: true }] },
    { name: "Budget", category: "SBU", owner: "Administration", slug: "sbu-budget", icon: "chart", color: "#0F766E", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["budget", "allocation"], requiresSbu: true, financialRequired: true },
    { name: "Unit Admin Expenses", category: "SBU", owner: "Administration", slug: "unit-admin-expenses", icon: "wallet", color: "#059669", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["unit", "admin", "expense"], requiresSbu: true, financialRequired: true },
    { name: "Rent", category: "SBU", owner: "Administration", slug: "sbu-rent", icon: "building", color: "#6366F1", allowedRequisitionTypes: ["SBU Requisition"], keywords: ["rent", "lease", "premises"], requiresSbu: true, financialRequired: true, paymentRequired: true },
    { name: "Laptop / Computer Request", category: "IT", owner: "Information Technology", slug: "laptop-computer-request", icon: "laptop", color: "#2563EB", allowedRequisitionTypes: ["IT Requisition"], keywords: ["laptop", "computer", "hardware"] },
    { name: "IT Equipment", category: "IT", owner: "Information Technology", slug: "it-equipment", icon: "monitor", color: "#2563EB", allowedRequisitionTypes: ["IT Requisition"], keywords: ["equipment", "device"] },
    { name: "Software and Subscriptions", category: "IT", owner: "Information Technology", slug: "software-subscriptions", icon: "code", color: "#7C3AED", allowedRequisitionTypes: ["IT Requisition"], keywords: ["software", "subscription", "licence"] },
    { name: "Network and Internet", category: "IT", owner: "Information Technology", slug: "network-internet", icon: "wifi", color: "#0891B2", allowedRequisitionTypes: ["IT Requisition"], keywords: ["network", "internet", "connectivity"] },
    { name: "Repairs and Maintenance", category: "IT", owner: "Information Technology", slug: "it-repairs-maintenance", icon: "wrench", color: "#D97706", allowedRequisitionTypes: ["IT Requisition"], keywords: ["repair", "maintenance"] },
    { name: "IT Consumables", category: "IT", owner: "Information Technology", slug: "it-consumables", icon: "package", color: "#0D9488", allowedRequisitionTypes: ["IT Requisition"], keywords: ["consumables", "toner", "cables"] },
    { name: "IT Request", category: "IT", owner: "Information Technology", slug: "it-request", icon: "monitor", color: "#2563EB", allowedRequisitionTypes: ["IT Requisition"], keywords: ["it request", "equipment", "software", "access", "repairs", "data subscription"], formSchema: [
        { key: "requestCategory", label: "Request Category", type: "select", options: ["Laptop / Computer", "IT Equipment", "Software and Subscriptions", "Network and Internet", "Data Subscription", "Repairs and Maintenance", "IT Consumables", "Other"], required: true },
        { key: "businessReason", label: "Business Justification", type: "textarea", required: true },
        { key: "itemSpecification", label: "Equipment / repair specification", type: "textarea", required: false },
        { key: "softwareName", label: "Software / Subscription Name", type: "text", required: true, conditionalOn: "requestCategory", conditionalValue: "Software and Subscriptions" },
        { key: "networkProvider", label: "Network Provider", type: "text", required: true, conditionalOn: "requestCategory", conditionalValue: "Data Subscription" },
        { key: "subscriptionPlan", label: "Data Plan / Bundle", type: "text", required: true, conditionalOn: "requestCategory", conditionalValue: "Data Subscription" },
        { key: "numberOfLines", label: "Number of Lines / SIMs", type: "number", required: true, conditionalOn: "requestCategory", conditionalValue: "Data Subscription" },
        { key: "subscriptionPeriod", label: "Subscription Period", type: "select", options: ["Monthly", "Quarterly", "Annually", "One-off"], required: true, conditionalOn: "requestCategory", conditionalValue: "Data Subscription" },
        { key: "accessDetails", label: "System / Access Required", type: "textarea", required: true, conditionalOn: "requestCategory", conditionalValue: "Access" },
        { key: "connectivityDetails", label: "Network / Internet Details", type: "textarea", required: true, conditionalOn: "requestCategory", conditionalValue: "Network and Internet" }
    ] },
    { name: "Data Subscription", category: "IT", owner: "Information Technology", slug: "data-subscription", icon: "wifi", color: "#0891B2", allowedRequisitionTypes: ["IT Requisition"], keywords: ["data", "subscription", "bundle", "SIM", "internet"], financialRequired: true, paymentRequired: true, formSchema: [{ key: "networkProvider", label: "Network Provider", type: "text", required: true }, { key: "subscriptionPlan", label: "Data Plan / Bundle", type: "text", required: true }, { key: "numberOfLines", label: "Number of Lines / SIMs", type: "number", required: true }, { key: "subscriptionPeriod", label: "Subscription Period", type: "select", options: ["Monthly", "Quarterly", "Annually", "One-off"], required: true }] },
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
        // Organisation labels vary between tenant imports (Admin/Administration,
        // IT/Information Technology, etc.). Resolve aliases first, then use an
        // existing tenant department as the service owner rather than silently
        // dropping the catalogue entry. No department is created or assigned to
        // a person by this seed.
        const ownerDepartment = findDepartment(entry.owner)
            || departments.find((department) => {
                const name = department.name.toLowerCase();
                return entry.category === "IT" ? name.includes("it") || name.includes("techn")
                    : entry.category === "SBU" ? name.includes("admin") || name.includes("corporate")
                    : name.includes("admin") || name.includes("corporate");
            })
            || departments[0];
        if (!ownerDepartment) {
            throw new Error(`Ringo has no active departments. Seed/import its organisation structure before the pilot catalogue.`);
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
            // Ringo IT requisition subtypes are grouped under the one IT Request
            // entry; the individual records remain tenant-owned for legacy links
            // and historical references, but are hidden from employee catalogues.
            catalogueVisible: entry.category !== "IT" || entry.slug === "it-request",
        };
        // A single $set supports both upsert and updates existing tenant rows.
        // Using overlapping $setOnInsert + $set paths causes MongoDB update-path
        // conflicts and was the reason the pilot catalogue could fail to seed.
        await BusinessService.updateOne(
            { company: company._id, slug: entry.slug },
            { $set: data },
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
        { company: company._id, active: true, slug: { $ne: "it-support" }, actionType: { $in: ["procurement", "service-request"] } },
        { $set: { actionType: "service-request", routeKey: "memo-composer", moduleId: "memos" } },
    );
    // Preserve the dedicated IT Support & Maintenance ticket workspace.
    await BusinessService.updateOne(
        { company: company._id, slug: "it-support" },
        { $set: { name: "IT Support & Maintenance", category: "IT", moduleId: "it", actionType: "it-support-center", routeKey: "it-support-center", icon: "laptop", catalogueVisible: false, description: "Log and track IT support tickets and use the quick-fix knowledge base." } },
    );
}
