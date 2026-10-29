import Employee from "../employee/employee.model.js";
import { verifyToken } from "./jwt.js";

function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

export default async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const payload = verifyToken(token);

    if (!payload?.id || !payload?.company) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // A valid JWT is not enough: reload the employee and current tenant state
    // so deactivated accounts and stale company/role claims stop working.
    const employee = await Employee.findOne({
      _id: payload.id,
      company: payload.company,
      active: true,
      loginEnabled: { $ne: false },
      employmentStatus: "Active",
      isActive: true,
      deletedAt: null,
    })
      .populate("company")
      .populate("role")
      .select("company role active loginEnabled employmentStatus isActive deletedAt");

    if (
      !employee ||
      !employee.company ||
      employee.company.isActive !== true ||
      employee.company.deletedAt != null
    ) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    // Roles are tenant-owned. A stale or incorrectly assigned role from a
    // different company must never grant access to this employee.
    if (
      employee.role &&
      (!sameId(employee.role.company, employee.company._id) ||
        employee.role.isActive !== true ||
        employee.role.deletedAt != null)
    ) {
      return res.status(403).json({
        success: false,
        message: "Employee role is invalid for this company",
      });
    }

    req.user = {
      ...payload,
      id: String(employee._id),
      company: String(employee.company._id),
      role: employee.role ? String(employee.role._id) : null,
    };

    return next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return next(error);
  }
}
