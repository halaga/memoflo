import express from "express";

import authorize from "../../middleware/authorize.js";
import authMiddleware from "./auth.middleware.js";
import RoleService from "./role.service.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const roles = await RoleService.listRoles(req.user.company);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/permissions",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const permissions = await RoleService.listPermissions();

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/assign/:employeeId",
  authorize("roles.update"),
  async (req, res, next) => {
    try {
      const employee = await RoleService.assignRole(
        req.params.id,
        req.params.employeeId,
        req.user.company
      );

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  authorize("roles.view"),
  async (req, res, next) => {
    try {
      const role = await RoleService.getRole(
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

router.post(
  "/",
  authorize("roles.create"),
  async (req, res, next) => {
    try {
      const role = await RoleService.createRole(
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

router.patch(
  "/:id",
  authorize("roles.update"),
  async (req, res, next) => {
    try {
      const role = await RoleService.updateRole(
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

router.delete(
  "/:id",
  authorize("roles.delete"),
  async (req, res, next) => {
    try {
      const result = await RoleService.deleteRole(
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
