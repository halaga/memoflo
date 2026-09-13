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
}

export default new SBUController();
