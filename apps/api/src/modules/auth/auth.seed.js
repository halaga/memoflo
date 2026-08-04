import Role from "./role.model.js";
import User from "./user.model.js";

import { hashPassword } from "./password.js";

export async function seedAuth(company) {
  let superAdminRole =
    await Role.findOne({
      name: "Super Admin",
      company: company._id,
    });

  if (!superAdminRole) {
    superAdminRole =
      await Role.create({
        company: company._id,
        name: "Super Admin",
        permissions: ["*"],
      });

    console.log(
      "✔ Super Admin Role Created"
    );
  }

  const existingUser =
    await User.findOne({
      email: "admin@ringo.ng",
    });

  if (!existingUser) {
    await User.create({
      company: company._id,

      firstName: "System",

      lastName: "Administrator",

      email: "admin@ringo.ng",

      password:
        await hashPassword("Admin123@"),

      role: superAdminRole._id,
    });

    console.log(
      "✔ Super Admin User Created"
    );
  }
}