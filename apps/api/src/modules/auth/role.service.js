import mongoose from "mongoose";

import Employee from "../employee/employee.model.js";
import Permission from "./permission.model.js";
import Role from "./role.model.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`${label} must be a valid id`);
  }
}

class RoleService {
  async listRoles(companyId) {
    return Role.find({
      company: companyId,
      deletedAt: null,
    })
      .sort({
        isSystem: -1,
        level: 1,
        name: 1,
      })
      .lean();
  }

  async getRole(id, companyId) {
    assertId(id, "Role id");

    const role = await Role.findOne({
      _id: id,
      company: companyId,
      deletedAt: null,
    }).lean();

    if (!role) {
      throw createError("Role not found", 404);
    }

    return role;
  }

  async createRole(companyId, payload) {
    const {
      name,
      code,
      level,
      description,
      permissions = [],
    } = payload;

    const roleName = String(name || "").trim();

    if (!roleName) {
      throw createError("Role name is required");
    }

    const existing = await Role.findOne({
      company: companyId,
      name: roleName,
      deletedAt: null,
    });

    if (existing) {
      throw createError("Role already exists", 409);
    }

    const validPermissions =
      await this.validatePermissions(permissions);

    return Role.create({
      company: companyId,
      name: roleName,
      code: code?.trim().toUpperCase(),
      level: level || 1,
      description: description || "",
      permissions: validPermissions,
      isSystem: false,
    });
  }

  async updateRole(id, companyId, payload) {
    assertId(id, "Role id");

    const role = await Role.findOne({
      _id: id,
      company: companyId,
      deletedAt: null,
    });

    if (!role) {
      throw createError("Role not found", 404);
    }

    if (role.isSystem && payload.name !== undefined) {
      throw createError("System role name cannot be changed");
    }

    if (payload.permissions !== undefined) {
      role.permissions = await this.validatePermissions(
        payload.permissions
      );
    }

    if (payload.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name) {
        throw createError("Role name cannot be empty");
      }
      role.name = name;
    }

    if (payload.code !== undefined) {
      role.code = String(payload.code).trim().toUpperCase();
    }

    if (payload.level !== undefined) {
      role.level = payload.level;
    }

    if (payload.description !== undefined) {
      role.description = String(payload.description).trim();
    }

    return role.save();
  }

  async deleteRole(id, companyId) {
    assertId(id, "Role id");

    const role = await Role.findOne({
      _id: id,
      company: companyId,
      deletedAt: null,
    });

    if (!role) {
      throw createError("Role not found", 404);
    }

    if (role.isSystem) {
      throw createError("System roles cannot be deleted");
    }

    await role.updateOne({
      deletedAt: new Date(),
      isActive: false,
    });

    return {
      success: true,
      message: "Role deleted successfully",
    };
  }

  async listPermissions() {
    return Permission.find({
      deletedAt: null,
    })
      .sort({
        module: 1,
        action: 1,
        name: 1,
      })
      .lean();
  }

  async validatePermissions(permissionNames = []) {
    if (!Array.isArray(permissionNames)) {
      throw createError("Permissions must be an array");
    }

    const uniqueNames = [...new Set(permissionNames)];

    if (!uniqueNames.length) {
      return [];
    }

    const permissions = await Permission.find({
      name: { $in: uniqueNames },
      deletedAt: null,
    }).lean();

    const validNames = new Set(
      permissions.map((permission) => permission.name)
    );

    const invalid = uniqueNames.filter(
      (permission) => !validNames.has(permission)
    );

    if (invalid.length) {
      throw createError(
        `Invalid permissions: ${invalid.join(", ")}`
      );
    }

    return uniqueNames;
  }

  async assignRole(roleId, employeeId, companyId) {
    assertId(roleId, "Role id");
    assertId(employeeId, "Employee id");

    const role = await Role.findOne({
      _id: roleId,
      company: companyId,
      deletedAt: null,
    });

    if (!role) {
      throw createError("Role not found", 404);
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
      active: true,
      deletedAt: null,
    });

    if (!employee) {
      throw createError("Employee not found in this company", 404);
    }

    employee.role = role._id;
    await employee.save();

    return Employee.findById(employee._id)
      .populate("company")
      .populate("position")
      .populate("role");
  }
}

export default new RoleService();
