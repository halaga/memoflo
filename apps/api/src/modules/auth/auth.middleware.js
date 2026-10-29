import AuthService from "./auth.service.js";
import { verifyToken } from "./jwt.js";

/**
 * Verify the JWT and revalidate the employee against the database on every
 * authenticated request. This makes account deactivation, termination, and
 * company changes take effect without waiting for the token to expire.
 */
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

    const claims = verifyToken(token);
    if (!claims?.id || !claims?.company) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const employee = await AuthService.me(claims.id, claims.company);
    req.user = {
      id: employee._id.toString(),
      company: employee.company?._id?.toString() || employee.company?.toString(),
      role: employee.role?._id?.toString() || employee.role?.toString() || null,
    };
    return next();
  } catch (error) {
    if (error?.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(401).json({
      success: false,
      message: error?.status === 401 ? error.message : "Invalid or expired session",
    });
  }
}
