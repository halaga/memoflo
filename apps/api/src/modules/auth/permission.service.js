import Employee from "../employee/employee.model.js";

class PermissionService {
  /**
   * Get the permissions belonging to an employee's assigned role.
   */
  async getEmployeePermissions(employeeId) {
    const employee = await Employee.findById(employeeId)
      .populate("role");

    if (!employee) {
      throw new Error("Employee not found");
    }

    if (!employee.role) {
      return [];
    }

    return employee.role.permissions || [];
  }

  /**
   * Check whether an employee has a specific permission.
   *
   * Example:
   * employeeHasPermission(employeeId, "memo.create")
   */
  async employeeHasPermission(employeeId, permission) {
    const permissions =
      await this.getEmployeePermissions(employeeId);

    return permissions.includes(permission);
  }

  /**
   * Check whether employee has at least one permission.
   */
  async hasAnyPermission(employeeId, permissions = []) {
    if (!permissions.length) {
      return false;
    }

    const employeePermissions =
      await this.getEmployeePermissions(employeeId);

    return permissions.some((permission) =>
      employeePermissions.includes(permission)
    );
  }

  /**
   * Check whether employee has every permission.
   */
  async hasAllPermissions(employeeId, permissions = []) {
    if (!permissions.length) {
      return false;
    }

    const employeePermissions =
      await this.getEmployeePermissions(employeeId);

    return permissions.every((permission) =>
      employeePermissions.includes(permission)
    );
  }
}

export default new PermissionService();