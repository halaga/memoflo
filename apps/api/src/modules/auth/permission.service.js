import Employee from "../employee/employee.model.js";

class PermissionService {
  /**
   * Resolve permissions only from an active employee's active role in the
   * same tenant. A stale/cross-tenant role reference grants no permissions.
   */
  async getEmployeePermissions(employeeId, expectedCompanyId = null) {
    const employee = await Employee.findOne({
      _id: employeeId,
      active: true,
      deletedAt: null,
      ...(expectedCompanyId ? { company: expectedCompanyId } : {}),
    }).populate({
      path: "role",
      match: {
        isActive: { $ne: false },
        deletedAt: null,
      },
    });

    if (!employee || !employee.role) return [];

    if (String(employee.role.company) !== String(employee.company)) {
      return [];
    }

    return Array.isArray(employee.role.permissions)
      ? employee.role.permissions
      : [];
  }

  async employeeHasPermission(employeeId, permission) {
    const permissions = await this.getEmployeePermissions(employeeId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(employeeId, permissions = []) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId);
    return permissions.some((permission) => employeePermissions.includes(permission));
  }

  async hasAllPermissions(employeeId, permissions = []) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId);
    return permissions.every((permission) => employeePermissions.includes(permission));
  }
}

export default new PermissionService();
