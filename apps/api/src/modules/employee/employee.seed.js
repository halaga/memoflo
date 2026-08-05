import Company from "../company/company.model.js";
import Employee from "./employee.model.js";
import bcrypt from "bcryptjs";

export async function seedEmployees() {
  const company = await Company.findOne();

  if (!company) return;

  const exists = await Employee.findOne({
    email: "admin@memoflo.com",
  });

  if (exists) {
    console.log("✔ Employees already seeded");
    return;
  }

  await Employee.create({
    company: company._id,
    employeeNo: "MEM240001",
    firstName: "Super",
    lastName: "Admin",
    email: "admin@memoflo.com",
    password: await bcrypt.hash("password123", 10),
  });

  console.log("✔ Super Admin Employee Created");
}