import EmployeeService from "./employee.service.js";

class EmployeeController {
  async create(req, res, next) {
    try {
      const employee =
        await EmployeeService.createEmployee(req.body);

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const employees =
        await EmployeeService.listEmployees(
          req.user.company
        );

      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const employee =
        await EmployeeService.getEmployee(
          req.params.id
        );

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee =
        await EmployeeService.updateEmployee(
          req.params.id,
          req.body
        );

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const employee =
        await EmployeeService.deleteEmployee(
          req.params.id
        );

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();