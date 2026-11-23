import mongoose from "mongoose";
import connectDB from "../database/mongodb.js";
import Company from "../modules/company/company.model.js";
import { seedBusinessServices } from "../modules/business-service/businessService.seed.js";
import { seedRingoApprovalConfiguration } from "../modules/workflow/ringo.workflow.seed.js";

async function main() {
  await connectDB();
  const company = await Company.findOne({ code: "RINGO", isActive: true, deletedAt: null });
  if (!company) throw new Error("Ringo tenant was not found. No records were changed.");

  await seedBusinessServices(company);
  await seedRingoApprovalConfiguration(company);

  console.log("Ringo pilot Business Services and approval workflows are ready.");
  console.log("Review Administration → Workflows for any positions still awaiting an office holder.");
}

main()
  .catch((error) => {
    console.error("Ringo pilot configuration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
