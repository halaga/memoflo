import connectDB from "./database/mongodb.js";

import { seedCompany } from "./modules/company/company.seed.js";

import { seedAuth } from "./modules/auth/auth.seed.js";
import { seedOrganization } from "./modules/organization/organization.seed.js";

async function run() {
  await connectDB();

  const company =
    await seedCompany();

    await seedOrganization(company);
    
  await seedAuth(company);

  console.log(
    "\n🎉 MemoFlo Seed Completed"
  );

  process.exit();
}

run();