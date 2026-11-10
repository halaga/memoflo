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
    } = payload || {};

    const roleName = String(name || "").trim();

    if (!roleName) {
      throw createError("Role name is required");
    }

    const normalizedCode = String(code || roleName)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!normalizedCode || ["SYSTEM_ADMIN", "COMPANY_ADMIN"].includes(normalizedCode)) {
      throw createError("This role code is reserved", 400);
    }

    const numericLevel = level === undefined ? 10 : Number(level);
    if (!Number.isInteger(numericLevel) || numericLevel < 1 || numericLevel > 99) {
      throw createError("Custom role level must be an integer between 1 and 99");
    }

    const existing = await Role.findOne({
      company: companyId,
      deletedAt: null,
      $or: [{ name: roleName }, { code: normalizedCode }],
    });

    if (existing) throw createError("Role name or code already exists", 409);

    const validPermissions = await this.validatePermissions(permissions);

    return Role.create({
      company: companyId,
      name: roleName,
      code: normalizedCode,
      level: numericLevel,
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

    if (role.isSystem) {
      throw createError("Built-in roles cannot be modified. Create a custom role instead", 403);
    }

    if (payload.code !== undefined) {
      const code = String(payload.code || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (!code || ["SYSTEM_ADMIN", "COMPANY_ADMIN"].includes(code)) {
        throw createError("This role code is reserved", 400);
      }
      const duplicate = await Role.findOne({
        company: companyId,
        code,
        _id: { $ne: role._id },
        deletedAt: null,
      });
      if (duplicate) throw createError("Role code already exists", 409);
      role.code = code;
    }

    if (payload.level !== undefined) {
      const level = Number(payload.level);
      if (!Number.isInteger(level) || level < 1 || level > 99) {
        throw createError("Custom role level must be an integer between 1 and 99");
      }
      role.level = level;
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

  async assignRole(roleId, employeeId, companyId, actorId) {
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

    if (role.code === "SYSTEM_ADMIN" || role.deletedAt) {
      throw createError("This role is not assignable", 403);
    }

    if (role.code === "COMPANY_ADMIN") {
      const actor = await Employee.findOne({
        _id: actorId,
        company: companyId,
        active: true,
        deletedAt: null,
      }).populate("role");
      if (actor?.role?.code !== "COMPANY_ADMIN") {
        throw createError("Only a company administrator can assign administrator access", 403);
      }
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

    return Employee.findOne({ _id: employee._id, company: companyId, active: true, deletedAt: null })
      .populate("company")
      .populate("position")
      .populate("role");
  }
}

export default new RoleService();
