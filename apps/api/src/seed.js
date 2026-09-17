import connectDB from "./database/mongodb.js";
import { seedCompany } from "./modules/company/company.seed.js";
import { seedEmployees } from "./modules/employee/employee.seed.js";
import { seedRoles } from "./modules/auth/role.seed.js";
import { seedOrganization } from "./modules/organization/organization.seed.js";
import { seedBusinessServices } from "./modules/business-service/businessService.seed.js";

async function run() {
  try {
    await connectDB();

    const company = await seedCompany();

    await seedOrganization(company);
    await seedEmployees(company);
    await seedRoles(company);
    await seedBusinessServices(company);

    console.log("\n🎉 MemoFlo seed completed");
    process.exit(0);
  } catch (error) {
    console.error("MemoFlo seed failed:", error);
    process.exit(1);
  }
}

run();
