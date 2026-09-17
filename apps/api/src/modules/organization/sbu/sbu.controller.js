import SBUService from "./sbu.service.js";

class SBUController {
  async list(req, res, next) {
    try {
      const sbus = await SBUService.listSBUs(req.user.company);

      res.json({
        success: true,
        data: sbus,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const sbu = await SBUService.getSBU(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: sbu,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const sbu = await SBUService.createSBU(
        req.user.company,
        req.body
      );

      res.status(201).json({
        success: true,
        data: sbu,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const sbu = await SBUService.updateSBU(
        req.params.id,
        req.user.company,
        req.body
      );

      res.json({
        success: true,
        data: sbu,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const sbu = await SBUService.deleteSBU(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: sbu,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SBUController();
