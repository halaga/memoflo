import BusinessService from "./businessService.model.js";
import Department from "../organization/department.model.js";

export async function seedBusinessServices(company) {
  console.log("\n🏢 Seeding Business Services...");

  const departments = await Department.find({
    company: company._id,
  });

  const getDepartment = (name) =>
    departments.find((d) => d.name === name);

  const services = [
    // =========================
    // IT
    // =========================
    {
      name: "Laptop Request",
      slug: "laptop-request",
      category: "IT Services",
      ownerDepartment: getDepartment("Information Technology"),
      icon: "laptop",
      color: "#2563EB",
    },

    {
      name: "Internet Subscription",
      slug: "internet-subscription",
      category: "IT Services",
      ownerDepartment: getDepartment("Information Technology"),
      icon: "wifi",
      color: "#2563EB",
    },

    {
      name: "Software Installation",
      slug: "software-installation",
      category: "IT Services",
      ownerDepartment: getDepartment("Information Technology"),
      icon: "box",
      color: "#2563EB",
    },

    // =========================
    // ADMINISTRATION
    // =========================
    {
      name: "Fuel Request",
      slug: "fuel-request",
      category: "Administration",
      ownerDepartment: getDepartment("Administration"),
      icon: "fuel",
      color: "#F59E0B",
    },

    {
      name: "Vehicle Repair",
      slug: "vehicle-repair",
      category: "Administration",
      ownerDepartment: getDepartment("Administration"),
      icon: "car",
      color: "#F59E0B",
    },

    {
      name: "Office Furniture",
      slug: "office-furniture",
      category: "Administration",
      ownerDepartment: getDepartment("Administration"),
      icon: "chair",
      color: "#F59E0B",
    },

    // =========================
    // HR
    // =========================
    {
      name: "Recruitment",
      slug: "recruitment",
      category: "Human Resources",
      ownerDepartment: getDepartment("Human Resources"),
      icon: "users",
      color: "#10B981",
    },

    {
      name: "Leave Request",
      slug: "leave-request",
      category: "Human Resources",
      ownerDepartment: getDepartment("Human Resources"),
      icon: "calendar",
      color: "#10B981",
    },

    // =========================
    // GENERAL
    // =========================
    {
      name: "General Memo",
      slug: "general-memo",
      category: "Communication",
      ownerDepartment: getDepartment("Administration"),
      icon: "file-text",
      color: "#6366F1",
    },
  ];

  for (const service of services) {
    const exists = await BusinessService.findOne({
      company: company._id,
      slug: service.slug,
    });

    if (exists) continue;

    await BusinessService.create({
      company: company._id,
      ...service,
      ownerDepartment: service.ownerDepartment._id,
    });

    console.log(`✔ ${service.name}`);
  }

  console.log("✅ Business Services Seed Complete");
}