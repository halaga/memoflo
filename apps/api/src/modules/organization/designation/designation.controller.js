import DesignationService from "./designation.service.js";

class DesignationController {
  async create(req, res, next) {
    try {
      const designation =
        await DesignationService.createDesignation(
          req.user.company,
          req.body
        );

      res.status(201).json({
        success: true,
        data: designation,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const designations =
        await DesignationService.listDesignations(
          req.user.company
        );

      res.json({
        success: true,
        data: designations,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const designation =
        await DesignationService.getDesignation(
          req.params.id
        );

      res.json({
        success: true,
        data: designation,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const designation =
        await DesignationService.updateDesignation(
          req.params.id,
          req.body
        );

      res.json({
        success: true,
        data: designation,
      });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await DesignationService.deleteDesignation(
        req.params.id
      );

      res.json({
        success: true,
        message: "Designation deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new DesignationController();