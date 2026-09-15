import EmployeeService from "./employee.service.js";

class EmployeeController {
  async create(req, res, next) {
    try {
      const result = await EmployeeService.createEmployee(req.user.company, req.body);
      res.status(201).json({ success: true, data: result.employee, temporaryPassword: result.temporaryPassword });
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try { res.json({ success: true, data: await EmployeeService.listEmployees(req.user.company) }); }
    catch (error) { next(error); }
  }

  async show(req, res, next) {
    try { res.json({ success: true, data: await EmployeeService.getEmployee(req.user.company, req.params.id) }); }
    catch (error) { next(error); }
  }

  async update(req, res, next) {
    try { res.json({ success: true, data: await EmployeeService.updateEmployee(req.user.company, req.params.id, req.body) }); }
    catch (error) { next(error); }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await EmployeeService.resetPassword(req.user.company, req.params.id, req.body?.password);
      res.json({ success: true, data: result.employee, temporaryPassword: result.temporaryPassword });
    } catch (error) { next(error); }
  }

  async remove(req, res, next) {
    try { res.json({ success: true, data: await EmployeeService.deleteEmployee(req.user.company, req.params.id) }); }
    catch (error) { next(error); }
  }
}

export default new EmployeeController();
