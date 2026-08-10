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
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const departments =
        await DepartmentService.listDepartments(req.user.company);

      res.json({
        success: true,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const department =
        await DepartmentService.getDepartment(req.params.id);

      res.json({
        success: true,
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const department =
        await DepartmentService.updateDepartment(
          req.params.id,
          req.body
        );

      res.json({
        success: true,
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await DepartmentService.deleteDepartment(req.params.id);

      res.json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new DepartmentController();