import Company from "../company/company.model.js";
import Employee from "./employee.model.js";
import bcrypt from "bcryptjs";

export async function seedEmployees() {
  const company = await Company.findOne();

  if (!company) {
    console.log("⚠️ No company found. Skipping employee seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(
    "password123",
    10
  );

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
    const exists = await Employee.findOne({
      email: employee.email,
    });

    if (exists) {
      console.log(`✔ ${employee.email} already exists`);
      continue;
    }

    await Employee.create({
      company: company._id,
      ...employee,
      password: passwordHash,
    });

    console.log(`✔ ${employee.email} created`);
  }

  console.log("✅ Employee Seed Complete");
}