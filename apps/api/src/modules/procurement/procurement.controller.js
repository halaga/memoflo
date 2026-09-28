import ProcurementService from "./procurement.service.js";

class ProcurementController {
  async list(req, res, next) {
    try {
      const data = await ProcurementService.list(req.user.company, req.user.id, req.query.mode || "mine");
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async get(req, res, next) {
    try {
      const data = await ProcurementService.get(req.params.id, req.user.company);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await ProcurementService.create(req.user.company, req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async act(req, res, next) {
    try {
      const data = await ProcurementService.act(req.params.id, req.user.company, req.user.id, req.body.action, req.body);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export default new ProcurementController();
