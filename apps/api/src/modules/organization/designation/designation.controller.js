import DesignationService from "./designation.service.js";

class DesignationController {
  async create(req, res, next) {
    try {
      const designation = await DesignationService.createDesignation(
        req.user.company,
        req.body
      );

      res.status(201).json({
        success: true,
        data: designation,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const designations = await DesignationService.listDesignations(
        req.user.company
      );

      res.json({
        success: true,
        data: designations,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const designation = await DesignationService.getDesignation(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: designation,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const designation = await DesignationService.updateDesignation(
        req.params.id,
        req.user.company,
        req.body
      );

      res.json({
        success: true,
        data: designation,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const designation = await DesignationService.deleteDesignation(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: designation,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DesignationController();
