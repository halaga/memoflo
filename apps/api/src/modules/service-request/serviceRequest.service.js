import ServiceRequest from "./serviceRequest.model.js";
import BusinessService from "../business-service/businessService.model.js";
import AuditService from "../audit/audit.service.js";

class ServiceRequestService {
  async create(companyId, requesterId, payload) {
    const service = payload.serviceId ? await BusinessService.findOne({ _id: payload.serviceId, company: companyId, active: true, isActive: true, deletedAt: null }).lean() : null;
    if (payload.serviceId && !service) throw Object.assign(new Error("Service not found"), { status: 404 });
    if (!payload.title?.trim()) throw new Error("Title is required");
    const request = await ServiceRequest.create({
      company: companyId,
      service: service?._id || null,
      requester: requesterId,
      title: payload.title.trim(),
      details: payload.details?.trim() || "",
      category: service?.category || payload.category || "General",
      priority: payload.priority || "Normal",
      metadata: payload.metadata || {},
    });
    await AuditService.record({ company: companyId, actor: requesterId, action: "service.request.created", resourceType: "service_request", resourceId: String(request._id), method: "POST", path: "/service-requests", outcome: "success", statusCode: 201, metadata: { service: service?.slug || null } });
    return ServiceRequest.findById(request._id).populate("service", "name slug category actionType routeKey").populate("requester", "_id firstName lastName email").lean();
  }

  async list(companyId, requesterId) {
    return ServiceRequest.find({ company: companyId, requester: requesterId, isActive: true, deletedAt: null }).sort({ createdAt: -1 }).limit(100).populate("service", "name slug category actionType routeKey").lean();
  }
}
export default new ServiceRequestService();
