import DepartmentService from "./department.service.js";

class DepartmentController {
  async create(req, res, next) {
    try {
      const department = await DepartmentService.createDepartment(
        req.user.company,
        req.body
      );

      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const departments = await DepartmentService.listDepartments(
        req.user.company
      );

      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const department = await DepartmentService.getDepartment(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const department = await DepartmentService.updateDepartment(
        req.params.id,
        req.user.company,
        req.body
      );

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const department = await DepartmentService.deleteDepartment(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DepartmentController();
