import EmployeeService from "./employee.service.js";
import EmployeeInvitationService from "./employeeInvitation.service.js";

class EmployeeController {

  async createInvitation(req, res, next) {
    try {
      const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
      const result = await EmployeeInvitationService.create(
        req.user.company,
        req.user.id,
        { ...req.body, origin }
      );
      res.status(201).json({ success: true, data: result.employee, invitation: result.invitation, invitationUrl: result.invitationUrl });
    } catch (error) { next(error); }
  }

  async inspectInvitation(req, res, next) {
    try {
      const data = await EmployeeInvitationService.inspect(req.params.token);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async acceptInvitation(req, res, next) {
    try {
      const data = await EmployeeInvitationService.accept(
        req.body?.token,
        req.body?.password,
        req.body?.passwordConfirmation
      );
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }


  async directory(req, res, next) {
    try {
      const employees = await EmployeeService.listDirectory(
        req.user.company,
        req.query.q
      );
      res.json({ success: true, data: employees });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await EmployeeService.createEmployee(
        req.user.company,
        req.body
      );
      res.status(201).json({
        success: true,
        data: result.employee,
        temporaryPassword: result.temporaryPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const employees = await EmployeeService.listEmployees(req.user.company);
      res.json({ success: true, data: employees });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployee(
        req.user.company,
        req.params.id
      );
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await EmployeeService.updateEmployee(
        req.user.company,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await EmployeeService.resetPassword(
        req.user.company,
        req.params.id,
        req.body?.password
      );
      res.json({
        success: true,
        data: result.employee,
        temporaryPassword: result.temporaryPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const employee = await EmployeeService.deleteEmployee(
        req.user.company,
        req.params.id
      );
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();
