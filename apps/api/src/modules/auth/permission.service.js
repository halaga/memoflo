import Employee from "../employee/employee.model.js";

class PermissionService {
  async getEmployeePermissions(employeeId) {
    const employee = await Employee.findById(employeeId).populate("role");
    if (!employee) throw new Error("Employee not found");
    if (!employee.role) return [];

    // Preserve explicit wildcard permissions and treat the highest-level
    // system roles as unrestricted tenant administrators.
    if (employee.role.permissions?.includes("*") ||
        (employee.role.isSystem && Number(employee.role.level || 0) >= 100)) {
      return ["*"];
    }

    return employee.role.permissions || [];
  }

  async employeeHasPermission(employeeId, permission) {
    const permissions = await this.getEmployeePermissions(employeeId);
    return permissions.includes("*") || permissions.includes(permission);
  }

  async hasAnyPermission(employeeId, permissions = []) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId);
    return employeePermissions.includes("*") || permissions.some((permission) => employeePermissions.includes(permission));
  }

  async hasAllPermissions(employeeId, permissions = []) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId);
    return employeePermissions.includes("*") || permissions.every((permission) => employeePermissions.includes(permission));
  }
}

export default new PermissionService();
