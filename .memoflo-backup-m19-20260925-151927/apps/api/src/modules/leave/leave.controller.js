import PermissionService from "../auth/permission.service.js";
import LeaveService from "./leave.service.js";

async function hasPermission(employeeId, permission) {
  const permissions = await PermissionService.getEmployeePermissions(employeeId);
  return permissions.includes("*") || permissions.includes(permission);
}

class LeaveController {
  async types(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.listTypes(req.user.company) });
    } catch (error) {
      next(error);
    }
  }

  async createType(req, res, next) {
    try {
      res.status(201).json({ success: true, data: await LeaveService.createType(req.user.company, req.body) });
    } catch (error) {
      next(error);
    }
  }

  async updateType(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.updateType(req.user.company, req.params.id, req.body) });
    } catch (error) {
      next(error);
    }
  }

  async balances(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.listBalances(req.user.company, req.user.id, req.query.year) });
    } catch (error) {
      next(error);
    }
  }

  async requests(req, res, next) {
    try {
      const requestedMode = req.query.mode || "mine";
      const isManager = requestedMode === "all" && (await hasPermission(req.user.id, "leave.manage"));
      const mode = requestedMode === "pending" || isManager ? requestedMode : "mine";
      res.json({ success: true, data: await LeaveService.listRequests(req.user.company, req.user.id, mode) });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      res.status(201).json({ success: true, data: await LeaveService.createRequest(req.user.company, req.user.id, req.body) });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.getRequest(req.params.id, req.user.company, req.user.id) });
    } catch (error) {
      next(error);
    }
  }

  async decide(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.decide(req.user.company, req.params.id, req.user.id, req.body.decision, req.body.comment) });
    } catch (error) {
      next(error);
    }
  }

  async file(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.decide(req.user.company, req.params.id, req.user.id, "file", req.body.comment) });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      res.json({ success: true, data: await LeaveService.cancel(req.user.company, req.params.id, req.user.id) });
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaveController();
