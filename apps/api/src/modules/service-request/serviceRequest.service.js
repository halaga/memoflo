import mongoose from "mongoose";
import ServiceRequest from "./serviceRequest.model.js";
import BusinessService from "../business-service/businessService.model.js";
import Employee from "../employee/employee.model.js";
import AuditService from "../audit/audit.service.js";

const TICKET_STATUSES = ["Submitted", "Assigned", "In Progress", "Waiting on Employee", "On Hold", "Completed", "Rejected", "Cancelled"];
const ACTIVE_STATUSES = ["Submitted", "Assigned", "In Progress", "Waiting on Employee", "On Hold"];
function fail(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function validId(value, label = "Ticket ID") { if (!mongoose.isValidObjectId(value)) throw fail(`${label} is invalid.`); }
function displayName(person) { return `${person?.firstName || "Employee"} ${person?.lastName || ""}`.trim(); }
function isManager(employee) {
  const permissions = employee?.role?.permissions || [];
  const roleText = `${employee?.role?.code || ""} ${employee?.role?.name || ""}`;
  return permissions.includes("*") || permissions.includes("it.support.manage") || permissions.includes("service-requests.manage") || /admin|it support|it specialist|helpdesk|help desk/i.test(roleText);
}
async function getActor(companyId, actorId) {
  const actor = await Employee.findOne({ _id: actorId, company: companyId, isActive: true, deletedAt: null })
    .populate("role", "name code permissions").select("_id firstName lastName email role");
  if (!actor) throw fail("Your employee account could not be found.", 404);
  return actor;
}
function redactInternalActivity(ticket, canSeeInternal) {
  if (!ticket || canSeeInternal) return ticket;
  const result = typeof ticket.toObject === "function" ? ticket.toObject() : { ...ticket };
  if (Array.isArray(result.activity)) {
    result.activity = result.activity.filter((entry) => !entry?.internal);
  }
  return result;
}
function populate(query) {
  return query.populate("service", "name slug category actionType routeKey")
    .populate("requester", "_id employeeNo firstName lastName email department position")
    .populate("assignedTo", "_id employeeNo firstName lastName email")
    .populate("activity.actor", "_id firstName lastName email");
}
async function logAudit(companyId, actorId, request, action, description, metadata = {}) {
  await AuditService.record({ company: companyId, actor: actorId, action, resourceType: "service_request", resourceId: String(request._id), method: "WORKFLOW", path: "/service-requests", outcome: "success", statusCode: 200, metadata: { ticketNo: request.ticketNo, description, ...metadata } });
}

class ServiceRequestService {
  async create(companyId, requesterId, payload) {
    const actor = await getActor(companyId, requesterId);
    const service = payload.serviceId ? await BusinessService.findOne({ _id: payload.serviceId, company: companyId, active: true, isActive: true, deletedAt: null }).lean() : null;
    if (payload.serviceId && !service) throw fail("Service not found.", 404);
    if (!payload.title?.trim()) throw fail("A ticket title is required.");
    if (!payload.details?.trim()) throw fail("Please describe the issue or request.");
    const count = await ServiceRequest.countDocuments({ company: companyId });
    const ticketNo = `IT-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const requestedAction = String(payload.metadata?.actionType || "").toLowerCase();
    const serviceCategory = String(service?.category || "").toLowerCase();
    const serviceSlug = String(service?.slug || "").toLowerCase();
    const isITService = service ? (serviceCategory === "it" && (requestedAction === "it-request" || ["it-support", "it-maintenance", "software-installation", "internet-subscription"].includes(serviceSlug))) : requestedAction === "it-request";
    if (!isITService) throw fail("IT tickets can only be created from an IT Support or IT Maintenance service. Use the appropriate Workplace or Business Purchase service for non-IT requests.", 400);
    const category = "IT";
    const priority = ["Low", "Normal", "High", "Urgent", "Critical"].includes(payload.priority) ? payload.priority : "Normal";
    const firstActivity = { actor: requesterId, actorName: displayName(actor), type: "created", message: "Ticket created and added to the support queue.", toStatus: "Submitted" };
    const request = await ServiceRequest.create({
      company: companyId, ticketNo, service: service?._id || null, requester: requesterId,
      title: payload.title.trim(), details: payload.details.trim(), category, priority, status: "Submitted",
      metadata: { ...(payload.metadata || {}), channel: "MemoFlo IT Solution Center" }, activity: [firstActivity], createdBy: String(requesterId),
    });
    await logAudit(companyId, requesterId, request, "it.ticket.created", "IT support ticket created.", { category, priority });
    return populate(ServiceRequest.findById(request._id)).lean();
  }

  async list(companyId, actorId, filters = {}) {
    const actor = await getActor(companyId, actorId);
    const query = { company: companyId, category: "IT", isActive: true, deletedAt: null };
    if (!isManager(actor)) query.requester = actorId;
    else if (filters.mode === "mine") query.requester = actorId;
    if (filters.status && TICKET_STATUSES.includes(filters.status)) query.status = filters.status;
    if (filters.category && String(filters.category).toUpperCase() !== "IT") query.category = String(filters.category).slice(0, 80);
    if (filters.q) query.$or = [
      { ticketNo: new RegExp(escapeRegex(String(filters.q).slice(0, 80)), "i") },
      { title: new RegExp(escapeRegex(String(filters.q).slice(0, 80)), "i") },
      { details: new RegExp(escapeRegex(String(filters.q).slice(0, 80)), "i") },
    ];
    const tickets = await populate(ServiceRequest.find(query).sort({ updatedAt: -1 }).limit(200)).lean();
    return tickets.map((ticket) => redactInternalActivity(ticket, isManager(actor)));
  }

  async get(id, companyId, actorId) {
    validId(id);
    const actor = await getActor(companyId, actorId);
    const request = await populate(ServiceRequest.findOne({ _id: id, company: companyId, isActive: true, deletedAt: null }));
    if (!request) throw fail("Ticket not found.", 404);
    if (String(request.requester?._id || request.requester) !== String(actorId) && !isManager(actor)) throw fail("You do not have access to this ticket.", 403);
    return redactInternalActivity(request, isManager(actor));
  }

  async comment(id, companyId, actorId, payload = {}) {
    validId(id);
    const actor = await getActor(companyId, actorId);
    const request = await ServiceRequest.findOne({ _id: id, company: companyId, isActive: true, deletedAt: null });
    if (!request) throw fail("Ticket not found.", 404);
    if (String(request.requester) !== String(actorId) && !isManager(actor)) throw fail("You do not have access to this ticket.", 403);
    const message = String(payload.message || "").trim();
    if (!message) throw fail("Enter a message before posting.");
    if (message.length > 4000) throw fail("Messages must be 4,000 characters or fewer.");
    if (["Completed", "Rejected", "Cancelled"].includes(request.status) && !isManager(actor)) throw fail("This ticket is closed. Reopen it by contacting IT support.", 409);
    request.activity.push({ actor: actorId, actorName: displayName(actor), type: "comment", message, internal: Boolean(payload.internal && isManager(actor)) });
    await request.save();
    await logAudit(companyId, actorId, request, "it.ticket.comment", "Ticket conversation updated.");
    return this.get(id, companyId, actorId);
  }

  async update(id, companyId, actorId, payload = {}) {
    validId(id);
    const actor = await getActor(companyId, actorId);
    if (!isManager(actor)) throw fail("Only IT support staff or workspace administrators can update ticket status.", 403);
    const request = await ServiceRequest.findOne({ _id: id, company: companyId, isActive: true, deletedAt: null });
    if (!request) throw fail("Ticket not found.", 404);
    const oldStatus = request.status;
    if (payload.status && payload.status !== oldStatus) {
      if (!TICKET_STATUSES.includes(payload.status)) throw fail("Unsupported ticket status.");
      request.status = payload.status;
      request.resolvedAt = ["Completed", "Rejected", "Cancelled"].includes(payload.status) ? new Date() : null;
      request.activity.push({ actor: actorId, actorName: displayName(actor), type: "status", message: String(payload.message || `Status changed from ${oldStatus} to ${payload.status}.`).trim(), fromStatus: oldStatus, toStatus: payload.status });
    }
    if (payload.priority && payload.priority !== request.priority) {
      if (!["Low", "Normal", "High", "Urgent", "Critical"].includes(payload.priority)) throw fail("Unsupported priority.");
      const oldPriority = request.priority;
      request.priority = payload.priority;
      request.activity.push({ actor: actorId, actorName: displayName(actor), type: "priority", message: `Priority changed from ${oldPriority} to ${payload.priority}.` });
    }
    if (payload.assignedTo !== undefined) {
      let assignee = null;
      if (payload.assignedTo) {
        assignee = await Employee.findOne({ _id: payload.assignedTo, company: companyId, active: true, isActive: true, deletedAt: null }).select("_id firstName lastName");
        if (!assignee) throw fail("The selected IT assignee was not found.", 404);
      }
      request.assignedTo = assignee?._id || null;
      request.activity.push({ actor: actorId, actorName: displayName(actor), type: "assignment", message: assignee ? `Ticket assigned to ${displayName(assignee)}.` : "Ticket assignment cleared." });
      if (request.status === "Submitted" && assignee) request.status = "Assigned";
    }
    if (!request.activity.length) throw fail("There are no changes to save.");
    request.updatedBy = String(actorId);
    await request.save();
    await logAudit(companyId, actorId, request, "it.ticket.updated", "IT support ticket updated.", { oldStatus, status: request.status });
    return this.get(id, companyId, actorId);
  }
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
export default new ServiceRequestService();
