import Employee from "../employee/employee.model.js";

class PermissionService {
  /**
   * Resolve permissions only from an active employee's active role in the
   * same company. Permissions themselves remain a global catalogue.
   */
  async getEmployeePermissions(employeeId) {
    const employee = await Employee.findOne({
      _id: employeeId,
      active: true,
      loginEnabled: { $ne: false },
      employmentStatus: "Active",
      isActive: true,
      deletedAt: null,
    })
      .populate("company")
      .populate("role");

    if (!employee) {
      const error = new Error("Employee account is inactive or unavailable");
      error.status = 401;
      throw error;
    }

    if (
      !employee.company ||
      employee.company.isActive !== true ||
      employee.company.deletedAt != null
    ) {
      const error = new Error("Employee company is inactive or unavailable");
      error.status = 403;
      throw error;
    }

    if (!employee.role) {
      return [];
    }

    if (
      String(employee.role.company) !== String(employee.company._id) ||
      employee.role.isActive !== true ||
      employee.role.deletedAt != null
    ) {
      const error = new Error("Employee role is invalid for this company");
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
