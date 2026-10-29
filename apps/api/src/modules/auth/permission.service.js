import Employee from "../employee/employee.model.js";

class PermissionService {
  /** Return current permissions only for an active employee's same-company role. */
  async getEmployeePermissions(employeeId) {
    const employee = await Employee.findOne({
      _id: employeeId,
      active: true,
      isActive: true,
      loginEnabled: { $ne: false },
      employmentStatus: "Active",
      deletedAt: null,
    }).populate("role", "_id company permissions");

    if (!employee) {
      const error = new Error("Employee not found or inactive");
      error.status = 401;
      throw error;
    }

    if (!employee.role) {
      return [];
    }

    if (String(employee.role.company) !== String(employee.company)) {
      const error = new Error("Employee role does not belong to this company");
      error.status = 403;
      throw error;
    }

    return employee.role.permissions || [];
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
