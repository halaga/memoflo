import PermissionService from "../modules/auth/permission.service.js";

export function authorize(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!requiredPermissions.length) {
        return next();
      }

      const permissions =
        await PermissionService.getEmployeePermissions(
          req.user.id
        );

      const allowed =
        permissions.includes("*") ||
        requiredPermissions.every((permission) =>
          permissions.includes(permission)
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
          requiredPermissions,
        });
      }

      req.userPermissions = permissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeAny(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const permissions =
        await PermissionService.getEmployeePermissions(
          req.user.id
        );

      const allowed =
        permissions.includes("*") ||
        requiredPermissions.some((permission) =>
          permissions.includes(permission)
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
          requiredPermissions,
        });
      }

      req.userPermissions = permissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default authorize;