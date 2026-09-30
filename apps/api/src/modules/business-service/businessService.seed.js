import BusinessService from "./businessService.model.js";
import Department from "../organization/department/department.model.js";

export async function seedBusinessServices(company) {
  console.log("\n🏢 Seeding Business Services...");

  const departments = await Department.find({ company: company._id, isActive: true });
  const getDepartment = (name) => departments.find((department) => department.name === name);

  const services = [
    { name: "Laptop Request", slug: "laptop-request", category: "IT", moduleId: "it", actionType: "it-request", routeKey: "laptop-request", keywords: ["laptop", "computer", "device", "hardware", "it"], requiresSbu: false, subscriptionFeature: "it", icon: "laptop", owner: "Information Technology" },
    { name: "Internet Subscription", slug: "internet-subscription", category: "IT", moduleId: "it", actionType: "it-request", routeKey: "internet-subscription", keywords: ["internet", "wifi", "data", "network", "it"], requiresSbu: false, subscriptionFeature: "it", icon: "wifi", owner: "Information Technology" },
    { name: "Software Installation", slug: "software-installation", category: "IT", moduleId: "it", actionType: "it-request", routeKey: "software-installation", keywords: ["software", "application", "install", "app", "it"], requiresSbu: false, subscriptionFeature: "it", icon: "box", owner: "Information Technology" },
    { name: "IT Support", slug: "it-support", category: "IT", moduleId: "it", actionType: "it-request", routeKey: "it-support", keywords: ["it", "support", "help", "computer", "technical"], requiresSbu: false, subscriptionFeature: "it", icon: "headset", owner: "Information Technology" },
    { name: "Fuel Request", slug: "fuel-request", category: "Workplace", moduleId: "workplace", actionType: "service-request", routeKey: "fuel-request", keywords: ["fuel", "petrol", "diesel", "vehicle"], requiresSbu: true, subscriptionFeature: "workplace", icon: "fuel", owner: "Administration" },
    { name: "Vehicle Repair", slug: "vehicle-repair", category: "Workplace", moduleId: "workplace", actionType: "service-request", routeKey: "vehicle-repair", keywords: ["vehicle", "car", "repair", "maintenance"], requiresSbu: true, subscriptionFeature: "workplace", icon: "car", owner: "Administration" },
    { name: "Office Furniture", slug: "office-furniture", category: "Workplace", moduleId: "workplace", actionType: "service-request", routeKey: "office-furniture", keywords: ["furniture", "chair", "desk", "office"], requiresSbu: true, subscriptionFeature: "workplace", icon: "chair", owner: "Administration" },
    { name: "Recruitment Request", slug: "recruitment", category: "People & HR", moduleId: "hr", actionType: "recruitment", routeKey: "recruitment", keywords: ["hr", "human resources", "recruitment", "hiring", "hire", "vacancy", "people"], requiresSbu: true, subscriptionFeature: "hr", icon: "users", owner: "Human Resources" },
    { name: "Leave Request", slug: "leave-request", category: "People & HR", moduleId: "hr", actionType: "leave", routeKey: "leave", keywords: ["hr", "human resources", "leave", "vacation", "absence", "time off", "people"], requiresSbu: true, subscriptionFeature: "hr", icon: "calendar", owner: "Human Resources" },
    { name: "Employee Information Request", slug: "employee-information", category: "People & HR", moduleId: "hr", actionType: "service-request", routeKey: "employee-information", keywords: ["hr", "human resources", "employee", "people", "profile", "information"], requiresSbu: false, subscriptionFeature: "hr", icon: "user", owner: "Human Resources" },
    { name: "General Memo", slug: "general-memo", category: "Communication", moduleId: "communication", actionType: "memo-simple", routeKey: "simple-memo", keywords: ["memo", "message", "communication", "letter", "internal"], requiresSbu: false, subscriptionFeature: "memos", icon: "file-text", owner: "Administration" },
    { name: "Approval Memo", slug: "approval-memo", category: "Communication", moduleId: "communication", actionType: "memo-approval", routeKey: "approval-memo", keywords: ["memo", "approval", "approve", "communication"], requiresSbu: true, subscriptionFeature: "memos", icon: "file-check", owner: "Administration" },
  ];

  for (const service of services) {
    const ownerDepartment = getDepartment(service.owner);
    if (!ownerDepartment) {
      console.warn(`⚠ Skipping ${service.name}: owner department not found`);
      continue;
    }

    const data = {
      company: company._id,
      name: service.name,
      slug: service.slug,
      category: service.category,
      ownerDepartment: ownerDepartment._id,
      moduleId: service.moduleId,
      actionType: service.actionType,
      routeKey: service.routeKey,
      keywords: service.keywords,
      requiresSbu: service.requiresSbu,
      subscriptionFeature: service.subscriptionFeature,
      icon: service.icon,
    };

    const existing = await BusinessService.findOne({ company: company._id, slug: service.slug });
    if (existing) {
      await BusinessService.updateOne({ _id: existing._id }, { $set: data });
      continue;
    }
    await BusinessService.create(data);
    console.log(`✔ ${service.name}`);
  }

  console.log("✅ Business Services Seed Complete");
}
