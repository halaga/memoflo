import ServiceRequestService from "./serviceRequest.service.js";

class ServiceRequestController {
  async create(req, res, next) {
    try { res.status(201).json({ success: true, data: await ServiceRequestService.create(req.user.company, req.user.id, req.body) }); }
    catch (error) { next(error); }
  }
  async list(req, res, next) {
    try { res.json({ success: true, data: await ServiceRequestService.list(req.user.company, req.user.id, req.query) }); }
    catch (error) { next(error); }
  }
  async get(req, res, next) {
    try { res.json({ success: true, data: await ServiceRequestService.get(req.params.id, req.user.company, req.user.id) }); }
    catch (error) { next(error); }
  }
  async comment(req, res, next) {
    try { res.json({ success: true, data: await ServiceRequestService.comment(req.params.id, req.user.company, req.user.id, req.body) }); }
    catch (error) { next(error); }
  }
  async update(req, res, next) {
    try { res.json({ success: true, data: await ServiceRequestService.update(req.params.id, req.user.company, req.user.id, req.body) }); }
    catch (error) { next(error); }
  }
}
export default new ServiceRequestController();
