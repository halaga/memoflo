import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is missing from apps/api/.env");

const collectionName = "workflowinstances";
const legacyIndexName = "company_1_resourceType_1_resourceId_1";
const activeIndexName = "active_workflow_resource_unique";

try {
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection(collectionName);
  const indexes = await collection.indexes();
  if (indexes.some((index) => index.name === activeIndexName)) {
    console.log(`Index ${activeIndexName} already exists; no changes made.`);
    process.exitCode = 0;
  } else {
    const duplicates = await collection.aggregate([
      { $match: { status: { $in: ["pending", "running"] }, isActive: true, deletedAt: null } },
      { $group: { _id: { company: "$company", resourceType: "$resourceType", resourceId: "$resourceId" }, ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 25 },
    ]).toArray();

    if (duplicates.length) {
      console.error("Migration stopped: duplicate active workflow instances must be reviewed before creating the unique index.");
      for (const duplicate of duplicates) console.error(JSON.stringify(duplicate));
      process.exitCode = 1;
    } else {
      const legacy = indexes.find((index) => index.name === legacyIndexName);
      if (legacy) await collection.dropIndex(legacyIndexName);
      try {
        await collection.createIndex(
          { company: 1, resourceType: 1, resourceId: 1 },
          {
            unique: true,
            name: activeIndexName,
            partialFilterExpression: {
              status: { $in: ["pending", "running"] },
              isActive: true,
              deletedAt: null,
            },
          },
        );
        console.log(`Created ${activeIndexName}. Duplicate active workflow starts are now blocked at the database level.`);
      } catch (error) {
        // Restore the old non-unique lookup index if unique-index creation fails.
        if (legacy) await collection.createIndex({ company: 1, resourceType: 1, resourceId: 1 }, { name: legacyIndexName });
        throw error;
      }
    }
  }
} finally {
  await mongoose.disconnect();
}
