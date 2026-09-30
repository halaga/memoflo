import ServiceRequestService from "./serviceRequest.service.js";
class ServiceRequestController {
  async create(req, res, next) { try { res.status(201).json({ success: true, data: await ServiceRequestService.create(req.user.company, req.user.id, req.body) }); } catch (e) { next(e); } }
  async list(req, res, next) { try { res.json({ success: true, data: await ServiceRequestService.list(req.user.company, req.user.id) }); } catch (e) { next(e); } }
}
export default new ServiceRequestController();
