import Role from "./role.model.js";
import Permission from "./permission.model.js";

class RoleService {
  async listRoles(companyId) {
    return Role.find({
      company: companyId,
    })
      .sort({
        isSystem: -1,
        level: 1,
        name: 1,
      })
      .lean();
  }

  async getRole(id, companyId) {
    const role = await Role.findOne({
      _id: id,
      company: companyId,
    }).lean();

    if (!role) {
      throw new Error("Role not found");
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

    if (!name?.trim()) {
      throw new Error("Role name is required");
    }

    const existing = await Role.findOne({
      company: companyId,
      name: name.trim(),
    });

    if (existing) {
      throw new Error("Role already exists");
    }

    const validPermissions =
      await this.validatePermissions(permissions);

    return Role.create({
      company: companyId,
      name: name.trim(),
      code: code?.trim().toUpperCase(),
      level: level || 1,
      description: description || "",
      permissions: validPermissions,
      isSystem: false,
    });
  }

  async updateRole(id, companyId, payload) {
    const role = await Role.findOne({
      _id: id,
      company: companyId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem && payload.name) {
      throw new Error(
        "System role name cannot be changed"
      );
    }

    if (payload.permissions) {
      payload.permissions =
        await this.validatePermissions(
          payload.permissions
        );
    }

    if (payload.name !== undefined) {
      role.name = payload.name.trim();
    }

    if (payload.code !== undefined) {
      role.code = payload.code.trim().toUpperCase();
    }

    if (payload.level !== undefined) {
      role.level = payload.level;
    }

    if (payload.description !== undefined) {
      role.description = payload.description;
    }

    if (payload.permissions !== undefined) {
      role.permissions = payload.permissions;
    }

    return role.save();
  }

  async deleteRole(id, companyId) {
    const role = await Role.findOne({
      _id: id,
      company: companyId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error(
        "System roles cannot be deleted"
      );
    }

    await role.deleteOne();

    return {
      success: true,
      message: "Role deleted successfully",
    };
  }

  async listPermissions() {
    return Permission.find()
      .sort({
        module: 1,
        action: 1,
        name: 1,
      })
      .lean();
  }

  async validatePermissions(permissionNames = []) {
    if (!Array.isArray(permissionNames)) {
      throw new Error(
        "Permissions must be an array"
      );
    }

    if (!permissionNames.length) {
      return [];
    }

    const permissions =
      await Permission.find({
        name: {
          $in: permissionNames,
        },
      }).lean();

    const validNames = new Set(
      permissions.map((permission) => permission.name)
    );

    const invalid = permissionNames.filter(
      (permission) => !validNames.has(permission)
    );

    if (invalid.length) {
      throw new Error(
        `Invalid permissions: ${invalid.join(", ")}`
      );
    }

    return [...new Set(permissionNames)];
  }
}

export default new RoleService();