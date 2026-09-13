import "../../config/env.js";
import mongoose from "mongoose";
import Role from "./role.model.js";
import Permission from "./permission.model.js";
import Company from "../company/company.model.js";

const permissions = [
  {
    name: "roles.view",
    module: "roles",
    action: "view",
    description: "View roles and permissions",
  },
  {
    name: "roles.create",
    module: "roles",
    action: "create",
    description: "Create roles",
  },
  {
    name: "roles.update",
    module: "roles",
    action: "update",
    description: "Update roles",
  },
  {
    name: "roles.delete",
    module: "roles",
    action: "delete",
    description: "Delete roles",
  },

  {
    name: "employees.view",
    module: "employees",
    action: "view",
    description: "View employees",
  },
  {
    name: "employees.create",
    module: "employees",
    action: "create",
    description: "Create employees",
  },
  {
    name: "employees.update",
    module: "employees",
    action: "update",
    description: "Update employees",
  },
  {
    name: "employees.delete",
    module: "employees",
    action: "delete",
    description: "Deactivate employees",
  },

  {
    name: "memos.view",
    module: "memos",
    action: "view",
    description: "View memos",
  },
  {
    name: "memos.create",
    module: "memos",
    action: "create",
    description: "Create memos",
  },
  {
    name: "memos.update",
    module: "memos",
    action: "update",
    description: "Update memos",
  },
  {
    name: "memos.delete",
    module: "memos",
    action: "delete",
    description: "Delete memos",
  },
  {
    name: "memos.approve",
    module: "memos",
    action: "approve",
    description: "Approve memos",
  },

  {
    name: "workflow.view",
    module: "workflow",
    action: "view",
    description: "View workflows",
  },
  {
    name: "workflow.create",
    module: "workflow",
    action: "create",
    description: "Create workflows",
  },
  {
    name: "workflow.update",
    module: "workflow",
    action: "update",
    description: "Update workflows",
  },
  {
    name: "workflow.delete",
    module: "workflow",
    action: "delete",
    description: "Delete workflows",
  },
  {
    name: "workflow.execute",
    module: "workflow",
    action: "execute",
    description: "Execute workflow actions",
  },

  {
    name: "business-services.view",
    module: "business-services",
    action: "view",
    description: "View business services",
  },
  {
    name: "business-services.create",
    module: "business-services",
    action: "create",
    description: "Create business services",
  },
  {
    name: "business-services.update",
    module: "business-services",
    action: "update",
    description: "Update business services",
  },
  {
    name: "business-services.delete",
    module: "business-services",
    action: "delete",
    description: "Delete business services",
  },
];

const systemRoles = [
  {
    name: "System Administrator",
    code: "SYSTEM_ADMIN",
    level: 100,
    description: "Full administrative access to the MemoFlo tenant.",
    permissions: permissions.map((permission) => permission.name),
  },

  {
    name: "Company Administrator",
    code: "COMPANY_ADMIN",
    level: 100,
    description:
      "Full administrative access to the MemoFlo company tenant.",
    permissions: permissions.map(
      (permission) => permission.name
    ),
  },

  {
    name: "IT Staff",
    code: "IT_STAFF",
    level: 20,
    description:
      "IT employee access to MemoFlo operational modules.",
    permissions: [
      "roles.view",

      "employees.view",

      "memos.view",
      "memos.create",
      "memos.update",

      "workflow.view",
      "workflow.execute",

      "business-services.view",
    ],
  },

  {
    name: "Employee",
    code: "EMPLOYEE",
    level: 10,
    description:
      "Standard employee access.",
    permissions: [
      "memos.view",
      "memos.create",
      "memos.update",
      "workflow.view",
      "business-services.view",
    ],
  },
];

async function seedRoles() {
  

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected");

  await Promise.all(
    permissions.map((permission) =>
      Permission.updateOne(
        {
          name: permission.name,
        },
        {
          $set: permission,
        },
        {
          upsert: true,
        }
      )
    )
  );

  const companies = await Company.find({});

  for (const company of companies) {
    for (const role of systemRoles) {
      await Role.updateOne(
        {
          company: company._id,
          code: role.code,
        },
        {
          $set: {
            company: company._id,
            name: role.name,
            code: role.code,
            level: role.level,
            description: role.description,
            permissions: role.permissions,
            isSystem: true,
          },
        },
        {
          upsert: true,
        }
      );
    }
  }

  console.log(
    `Seeded ${permissions.length} permissions`
  );

  console.log(
    `Seeded ${companies.length} company role sets`
  );

  await mongoose.disconnect();

  console.log("Role seed complete");
}

seedRoles().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});