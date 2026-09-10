import express from "express";
import RoleService from "./role.service.js";
import authMiddleware from "./auth.middleware.js";
import authorize from "../../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/roles
 */
router.get(
  "/",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const roles =
        await RoleService.listRoles(
          req.user.company
        );

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/roles/permissions
 */
router.get(
  "/permissions",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const permissions =
        await RoleService.listPermissions();

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/roles/:id
 */
router.get(
  "/:id",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const role =
        await RoleService.getRole(
          req.params.id,
          req.user.company
        );

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/roles
 */
router.post(
  "/",
  authorize("roles.create"),
  async (req, res, next) => {
    try {
      const role =
        await RoleService.createRole(
          req.user.company,
          req.body
        );

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/roles/:id
 */
router.patch(
  "/:id",
  authorize("roles.update"),
  async (req, res, next) => {
    try {
      const role =
        await RoleService.updateRole(
          req.params.id,
          req.user.company,
          req.body
        );

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/roles/:id
 */
router.delete(
  "/:id",
  authorize("roles.delete"),
  async (req, res, next) => {
    try {
      const result =
        await RoleService.deleteRole(
          req.params.id,
          req.user.company
        );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;