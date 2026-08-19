import Employee from "./employee.model.js";
import bcrypt from "bcryptjs";

const email = "melvin@memoflo.com";
const newPassword = "password123";

const employee =
  await Employee.findOne({ email });

if (!employee) {
  console.log(`❌ Employee not found: ${email}`);
  process.exit(1);
}

employee.password =
  await bcrypt.hash(newPassword, 10);

await employee.save();

console.log(`✅ Password reset for ${email}`);
console.log(`🔑 New password: ${newPassword}`);

process.exit(0);