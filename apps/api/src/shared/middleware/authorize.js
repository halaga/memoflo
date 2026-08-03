export default function authorize(
  permission
) {
  return async (
    req,
    res,
    next
  ) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const hasPermission =
        user.permissions?.includes(
          permission
        );

      if (!hasPermission) {
        return res.status(403).json({
          message:
            "Permission denied",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}