import EmployeeService from "./employee.service.js";

class EmployeeController {
  async create(req, res, next) {
    try {
      const employee = await EmployeeService.createEmployee(req.body);

      res.status(201).json(employee);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const employees = await EmployeeService.getEmployees(
        req.params.companyId
      );

      res.json(employees);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployee(
        req.params.id
      );

      res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await EmployeeService.updateEmployee(
        req.params.id,
        req.body
      );

      res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const employee = await EmployeeService.deactivateEmployee(
        req.params.id
      );

      res.json(employee);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();