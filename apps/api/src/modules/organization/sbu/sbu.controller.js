import SBUService from "./sbu.service.js";

class SBUController {
  async list(req, res, next) {
    try {
      const sbus = await SBUService.listSBUs(req.user.company);
      res.json({ success: true, data: sbus });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const sbu = await SBUService.getSBU(req.params.id, req.user.company);
      res.json({ success: true, data: sbu });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const sbu = await SBUService.createSBU(req.user.company, req.body);
      res.status(201).json({ success: true, data: sbu });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const sbu = await SBUService.updateSBU(
        req.params.id,
        req.user.company,
        req.body
      );
      res.json({ success: true, data: sbu });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await SBUService.deleteSBU(req.params.id, req.user.company);
      res.json({ success: true, message: "SBU deactivated successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default new SBUController();
