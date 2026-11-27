import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });
import Company from "../modules/company/company.model.js";
import { seedBusinessServices } from "../modules/business-service/businessService.seed.js";
import { seedRingoApprovalConfiguration } from "../modules/workflow/ringo.workflow.seed.js";

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing. Create apps/api/.env from .env.example and set your Ringo MongoDB connection string. Run this command from apps/api.");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MemoFlo MongoDB.");
  const company = await Company.findOne({ code: "RINGO", isActive: true, deletedAt: null });
  if (!company) throw new Error("Ringo tenant was not found. No records were changed.");

  await seedBusinessServices(company);
  await seedRingoApprovalConfiguration(company);

  console.log("Ringo pilot Business Services, Requisition Types and approval workflows are ready.");
  console.log("The seed is tenant-scoped and safe to run again; it does not create employee accounts or assign unknown office holders.");
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
