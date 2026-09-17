import bcrypt from "bcryptjs";

import connectDB from "../database/mongodb.js";
import Employee from "../modules/employee/employee.model.js";

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function usage() {
  console.log(`
MemoFlo login recovery

Usage:
  npm run reset:login -- --email admin@memoflo.com --password "NewPassword123!"

Options:
  --email       Employee login email
  --password    New password (minimum 8 characters)
`);
}

async function run() {
  const email = getArgument("--email")?.trim().toLowerCase();
  const password = getArgument("--password");

  if (!email || !password) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  await connectDB();

  const employee = await Employee.findOne({
    email,
    deletedAt: null,
  });

  if (!employee) {
    throw new Error(`No employee account found for ${email}.`);
  }

  employee.password = await bcrypt.hash(password, 10);
  employee.loginEnabled = true;
  employee.active = true;
  employee.employmentStatus = "Active";

  await employee.save();

  console.log(`Login restored for ${employee.firstName} ${employee.lastName}.`);
  console.log(`Email: ${employee.email}`);
}

run()
  .catch((error) => {
    console.error("Login recovery failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import("mongoose");
    await mongoose.default.connection.close().catch(() => {});
  });
