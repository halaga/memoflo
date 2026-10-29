import Employee from "../employee/employee.model.js";
import { verifyToken } from "./jwt.js";

function unauthorized(res, message = "Authentication required") {
  return res.status(401).json({
    success: false,
    message,
  });
}

export default async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return unauthorized(res);
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return unauthorized(res);
  }

  let claims;
  try {
    claims = verifyToken(token);
  } catch {
    return unauthorized(res, "Invalid token");
  }

  if (!claims?.id || !claims?.company) {
    return unauthorized(res, "Invalid token");
  }

  try {
    // A valid JWT is not proof that the account is still active. Reload the
    // employee on each protected request so deactivation and company changes
    // take effect immediately, and never trust a client-supplied company ID.
    const employee = await Employee.findOne({
      _id: claims.id,
      company: claims.company,
      active: true,
      isActive: true,
      loginEnabled: { $ne: false },
      employmentStatus: "Active",
      deletedAt: null,
    })
      .select("_id company role active loginEnabled employmentStatus deletedAt")
      .populate("role", "_id company permissions name code");

    if (!employee) {
      return unauthorized(res, "Session is no longer valid");
    }

    const employeeCompanyId = String(employee.company);
    const roleCompanyId = employee.role?.company
      ? String(employee.role.company)
      : null;

    // Roles are tenant-owned. A role from another company must never grant
    // permissions to this employee, even if its permission list is valid.
    if (roleCompanyId && roleCompanyId !== employeeCompanyId) {
      return res.status(403).json({
        success: false,
        message: "Employee role does not belong to this company",
      });
    }

    req.user = {
      ...claims,
      id: String(employee._id),
      company: employeeCompanyId,
      role: employee.role ? String(employee.role._id) : null,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
