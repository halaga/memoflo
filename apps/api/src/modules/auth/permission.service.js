import Employee from "../employee/employee.model.js";

class PermissionService {
  /** Return only permissions from the active employee's role in their own company. */
  async getEmployeePermissions(employeeId, companyId = null) {
    const query = {
      _id: employeeId,
      active: true,
      loginEnabled: { $ne: false },
      employmentStatus: "Active",
      deletedAt: null,
    };
    if (companyId) query.company = companyId;

    const employee = await Employee.findOne(query)
      .populate("role")
      .select("_id company role active loginEnabled employmentStatus deletedAt");

    if (!employee) {
      const error = new Error("Employee not found or inactive");
      error.status = 401;
      throw error;
    }

    if (!employee.role) return [];

    // A role reference must not grant permissions from another tenant.
    const roleCompany = employee.role.company?.toString?.() || employee.role.company?.toString?.();
    if (!roleCompany || roleCompany !== employee.company.toString() || employee.role.deletedAt) {
      return [];
    }

    return Array.isArray(employee.role.permissions) ? employee.role.permissions : [];
  }

  async employeeHasPermission(employeeId, permission, companyId = null) {
    const permissions = await this.getEmployeePermissions(employeeId, companyId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(employeeId, permissions = [], companyId = null) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId, companyId);
    return permissions.some((permission) => employeePermissions.includes(permission));
  }

  async hasAllPermissions(employeeId, permissions = [], companyId = null) {
    if (!permissions.length) return false;
    const employeePermissions = await this.getEmployeePermissions(employeeId, companyId);
    return permissions.every((permission) => employeePermissions.includes(permission));
  }
}

export default new PermissionService();
