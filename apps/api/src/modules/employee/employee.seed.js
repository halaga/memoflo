import bcrypt from "bcryptjs";

import Company from "../company/company.model.js";
import Employee from "./employee.model.js";

export async function seedEmployees(company = null) {
  const targetCompany =
    company || (await Company.findOne());

  if (!targetCompany) {
    console.log("⚠️ No company found. Skipping employee seed.");
    return;
  }

  const password =
    process.env.SEED_ADMIN_PASSWORD || "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  const employees = [
    {
      employeeNo: "MEM240001",
      firstName: "Super",
      lastName: "Admin",
      email: "admin@memoflo.com",
    },
    {
      employeeNo: "MEM240002",
      firstName: "Melvin",
      lastName: "Dabo",
      email: "melvin@memoflo.com",
    },
  ];

  for (const employee of employees) {
    const existing = await Employee.findOne({
      email: employee.email,
    });

    if (existing) {
      console.log(`✔ ${employee.email} already exists`);
      continue;
    }

    await Employee.create({
      company: targetCompany._id,
      ...employee,
      password: passwordHash,
      loginEnabled: true,
      active: true,
      employmentStatus: "Active",
    });

    console.log(`✔ ${employee.email} created`);
  }

  console.log("✅ Employee seed complete");
}
