import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import Position from "../position/position.model.js";
import LeaveBalance from "./leaveBalance.model.js";
import LeaveEvent from "./leaveEvent.model.js";
import LeaveRequest from "./leaveRequest.model.js";
import LeaveType from "./leaveType.model.js";

function cleanDate(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function businessDays(startValue, endValue) {
  const start = cleanDate(startValue);
  const end = cleanDate(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return days;
}

async function resolveApprover(employee) {
  if (employee.reportsTo) {
    return Employee.findOne({ _id: employee.reportsTo, company: employee.company, active: true, deletedAt: null });
  }
  if (employee.position) {
    const position = await Position.findOne({ _id: employee.position, company: employee.company, active: true, deletedAt: null }).populate("reportsTo");
    if (position?.reportsTo?.occupant) {
      return Employee.findOne({ _id: position.reportsTo.occupant, company: employee.company, active: true, deletedAt: null });
    }
  }
  return null;
}

async function ensureBalance(company, employee, leaveType, year) {
  return LeaveBalance.findOneAndUpdate(
    { company, employee, leaveType, year },
    { $setOnInsert: { company, employee, leaveType, year, allocated: leaveType.daysPerYear } },
    { new: true, upsert: true, runValidators: true }
  );
}

class LeaveService {
  async recordEvent({ company, leaveRequest, actor, type, title, description, fromStatus = null, toStatus = null, comment = null, metadata = {} }) {
    return LeaveEvent.create({ company, leaveRequest, actor, type, title, description, fromStatus, toStatus, comment: comment?.trim() || null, metadata });
  }

  async listTypes(company) {
    return LeaveType.find({ company, active: true, isActive: true, deletedAt: null }).sort({ name: 1 }).lean();
  }

  async createType(company, payload) {
    const type = await LeaveType.create({
      company,
      name: String(payload.name || "").trim(),
      code: String(payload.code || "").trim().toUpperCase(),
      daysPerYear: Number(payload.daysPerYear || 0),
      paid: payload.paid !== false,
      carryForward: payload.carryForward === true,
      requiresApproval: payload.requiresApproval !== false,
    });
    return type;
  }

  async updateType(company, id, payload) {
    const type = await LeaveType.findOneAndUpdate(
      { _id: id, company, active: true, deletedAt: null },
      { $set: { name: payload.name, code: String(payload.code || "").toUpperCase(), daysPerYear: Number(payload.daysPerYear || 0), paid: payload.paid !== false, carryForward: payload.carryForward === true, requiresApproval: payload.requiresApproval !== false } },
      { new: true, runValidators: true }
    );
    if (!type) { const error = new Error("Leave type not found"); error.status = 404; throw error; }
    return type;
  }

  async listBalances(company, employeeId, year = new Date().getFullYear()) {
    const types = await this.listTypes(company);
    return Promise.all(types.map(async (type) => {
      const balance = await ensureBalance(company, employeeId, type, Number(year));
      return { ...type, balance };
    }));
  }

  async createRequest(company, employeeId, payload) {
    const employee = await Employee.findOne({ _id: employeeId, company, active: true, employmentStatus: "Active", deletedAt: null });
    if (!employee) { const error = new Error("Employee not found"); error.status = 404; throw error; }
    const leaveType = await LeaveType.findOne({ _id: payload.leaveType, company, active: true, isActive: true, deletedAt: null });
    if (!leaveType) { const error = new Error("Leave type not found"); error.status = 404; throw error; }
    const startDate = cleanDate(payload.startDate);
    const endDate = cleanDate(payload.endDate);
    const days = businessDays(startDate, endDate);
    if (!days) { const error = new Error("Leave dates must contain at least one working day"); error.status = 400; throw error; }
    if (startDate < cleanDate(new Date())) { const error = new Error("Leave cannot start in the past"); error.status = 400; throw error; }

    if (startDate.getFullYear() !== endDate.getFullYear()) { const error = new Error("Leave cannot span two calendar years"); error.status = 400; throw error; }
    const overlap = await LeaveRequest.exists({ company, employee: employeeId, status: { $in: ["Pending", "Approved"] }, startDate: { $lte: endDate }, endDate: { $gte: startDate }, isActive: true, deletedAt: null });
    if (overlap) { const error = new Error("You already have a pending or approved leave covering part of these dates"); error.status = 400; throw error; }

    const year = startDate.getFullYear();
    const balance = await ensureBalance(company, employeeId, leaveType, year);
    const available = balance.allocated - balance.used - balance.pending;
    if (days > available) { const error = new Error(`Insufficient ${leaveType.name} balance. Available: ${available} day(s).`); error.status = 400; throw error; }

    const approver = await resolveApprover(employee);
    const status = leaveType.requiresApproval ? "Pending" : "Approved";
    const request = await LeaveRequest.create({ company, employee: employeeId, leaveType: leaveType._id, startDate, endDate, days, reason: String(payload.reason || "").trim(), status, approver: approver?._id || null, decisionBy: status === "Approved" ? employeeId : null, decisionAt: status === "Approved" ? new Date() : null });

    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: status === "Pending" ? days : 0, used: status === "Approved" ? days : 0 } });
    await this.recordEvent({ company, leaveRequest: request._id, actor: employeeId, type: "leave.created", title: "Leave request submitted", description: `${leaveType.name} leave request for ${days} working day(s) was submitted.`, toStatus: status, metadata: { leaveType: leaveType.code, days } });

    if (status === "Pending" && approver) {
      await NotificationService.create({ company, recipient: approver._id, type: "leave", title: "Leave approval required", message: `${employee.firstName} ${employee.lastName} submitted a ${leaveType.name} leave request.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString() }, createdBy: employeeId });
    }
    return this.getRequest(request._id, company, employeeId);
  }

  async listRequests(company, employeeId, mode = "mine") {
    const filter = { company, isActive: true, deletedAt: null };
    if (mode === "pending") filter.approver = employeeId, filter.status = "Pending";
    else if (mode === "all") {}
    else filter.employee = employeeId;
    return LeaveRequest.find(filter).populate("employee", "_id firstName lastName email").populate("leaveType", "_id name code paid").populate("approver", "_id firstName lastName").sort({ createdAt: -1 }).limit(100).lean();
  }

  async getRequest(id, company, employeeId = null) {
    const request = await LeaveRequest.findOne({ _id: id, company, isActive: true, deletedAt: null }).populate("employee", "_id firstName lastName email employeeNo position reportsTo").populate("leaveType").populate("approver", "_id firstName lastName email").populate("decisionBy", "_id firstName lastName email").lean();
    if (!request) { const error = new Error("Leave request not found"); error.status = 404; throw error; }
    const events = await LeaveEvent.find({ company, leaveRequest: id }).populate("actor", "_id firstName lastName email").sort({ createdAt: -1 }).lean();
    return { request, events };
  }

  async canAct(requestId, company, employeeId) {
    const request = await LeaveRequest.findOne({ _id: requestId, company, isActive: true, deletedAt: null });
    if (!request) return false;
    if (request.status !== "Pending") return false;
    if (String(request.approver || "") === String(employeeId)) return true;
    const employee = await Employee.findOne({ _id: employeeId, company, active: true, deletedAt: null }).populate("role");
    return employee?.role?.permissions?.includes("leave.approve") || employee?.role?.permissions?.includes("leave.manage") || employee?.role?.permissions?.includes("*");
  }

  async decide(company, requestId, actorId, decision, comment = "") {
    const request = await LeaveRequest.findOne({ _id: requestId, company, isActive: true, deletedAt: null }).populate("employee", "_id firstName lastName").populate("leaveType", "_id name");
    if (!request) { const error = new Error("Leave request not found"); error.status = 404; throw error; }
    if (!(await this.canAct(requestId, company, actorId))) { const error = new Error("You are not authorized to decide this leave request"); error.status = 403; throw error; }
    const normalized = decision === "approve" ? "Approved" : "Rejected";
    if (normalized === "Rejected" && !String(comment || "").trim()) { const error = new Error("A rejection reason is required"); error.status = 400; throw error; }
    const fromStatus = request.status;
    request.status = normalized;
    request.decisionBy = actorId;
    request.decisionAt = new Date();
    request.decisionComment = String(comment || "").trim() || null;
    await request.save();

    const balance = await ensureBalance(company, request.employee._id, request.leaveType, request.startDate.getFullYear());
    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days, used: normalized === "Approved" ? request.days : 0 } });
    await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: `leave.${normalized.toLowerCase()}`, title: normalized === "Approved" ? "Leave request approved" : "Leave request rejected", description: `${request.leaveType.name} leave request was ${normalized.toLowerCase()}.`, fromStatus, toStatus: normalized, comment: request.decisionComment });
    await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: normalized === "Approved" ? "Leave request approved" : "Leave request rejected", message: normalized === "Approved" ? `Your ${request.leaveType.name} leave request was approved.` : `Your ${request.leaveType.name} leave request was rejected.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString() }, createdBy: actorId });
    return this.getRequest(request._id, company, actorId);
  }

  async cancel(company, requestId, employeeId) {
    const request = await LeaveRequest.findOne({ _id: requestId, company, employee: employeeId, isActive: true, deletedAt: null }).populate("leaveType");
    if (!request) { const error = new Error("Leave request not found"); error.status = 404; throw error; }
    if (!["Pending", "Approved"].includes(request.status)) { const error = new Error("This leave request cannot be cancelled"); error.status = 400; throw error; }
    const fromStatus = request.status;
    const balance = await ensureBalance(company, employeeId, request.leaveType, request.startDate.getFullYear());
    if (request.status === "Pending") await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days } });
    if (request.status === "Approved") await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { used: -request.days } });
    request.status = "Cancelled";
    await request.save();
    await this.recordEvent({ company, leaveRequest: request._id, actor: employeeId, type: "leave.cancelled", title: "Leave request cancelled", description: "The employee cancelled the leave request.", fromStatus, toStatus: "Cancelled" });
    return this.getRequest(request._id, company, employeeId);
  }
}

export default new LeaveService();
