import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import Position from "../position/position.model.js";
import Department from "../organization/department/department.model.js";
import SBU from "../organization/sbu/sbu.model.js";
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

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function resolveApprovalChain(employee) {
  const supervisor = employee.reportsTo
    ? await Employee.findOne({
        _id: employee.reportsTo,
        company: employee.company,
        active: true,
        employmentStatus: "Active",
        deletedAt: null,
      })
    : null;

  let sbuId = employee.position?.sbu || null;
  if (!sbuId && employee.position?._id) {
    const position = await Position.findOne({
      _id: employee.position._id,
      company: employee.company,
      active: true,
      deletedAt: null,
    }).select("sbu").lean();
    sbuId = position?.sbu || null;
  }

  const sbuHead = sbuId
    ? await SBU.findOne({
        _id: sbuId,
        company: employee.company,
        active: true,
        deletedAt: null,
      }).populate({
        path: "head",
        match: {
          company: employee.company,
          active: true,
          employmentStatus: "Active",
          deletedAt: null,
        },
        select: "_id firstName lastName email employeeNo position",
      })
    : null;

  return {
    supervisor,
    sbuHead: sbuHead?.head || null,
  };
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
    return LeaveType.create({
      company,
      name: String(payload.name || "").trim(),
      code: String(payload.code || "").trim().toUpperCase(),
      daysPerYear: Number(payload.daysPerYear || 0),
      paid: payload.paid !== false,
      carryForward: payload.carryForward === true,
      requiresApproval: payload.requiresApproval !== false,
    });
  }

  async updateType(company, id, payload) {
    const type = await LeaveType.findOneAndUpdate(
      { _id: id, company, active: true, deletedAt: null },
      {
        $set: {
          name: String(payload.name || "").trim(),
          code: String(payload.code || "").trim().toUpperCase(),
          daysPerYear: Number(payload.daysPerYear || 0),
          paid: payload.paid !== false,
          carryForward: payload.carryForward === true,
          requiresApproval: payload.requiresApproval !== false,
        },
      },
      { new: true, runValidators: true }
    );
    if (!type) throw fail("Leave type not found", 404);
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
    const employee = await Employee.findOne({
      _id: employeeId,
      company,
      active: true,
      employmentStatus: "Active",
      deletedAt: null,
    }).populate("position", "_id title sbu department designation");

    if (!employee) throw fail("Employee not found", 404);

    const leaveType = await LeaveType.findOne({
      _id: payload.leaveType,
      company,
      active: true,
      isActive: true,
      deletedAt: null,
    });
    if (!leaveType) throw fail("Leave type not found", 404);

    const startDate = cleanDate(payload.startDate);
    const endDate = cleanDate(payload.endDate);
    const days = businessDays(startDate, endDate);
    if (!days) throw fail("Leave dates must contain at least one working day");
    if (startDate < cleanDate(new Date())) throw fail("Leave cannot start in the past");
    if (startDate.getFullYear() !== endDate.getFullYear()) throw fail("Leave cannot span two calendar years");

    const overlap = await LeaveRequest.exists({
      company,
      employee: employeeId,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      isActive: true,
      deletedAt: null,
    });
    if (overlap) throw fail("You already have a pending or approved leave covering part of these dates");

    const balance = await ensureBalance(company, employeeId, leaveType, startDate.getFullYear());
    const available = balance.allocated - balance.used - balance.pending;
    if (days > available) throw fail(`Insufficient ${leaveType.name} balance. Available: ${available} day(s).`);

    if (!leaveType.requiresApproval) {
      const request = await LeaveRequest.create({
        company,
        employee: employeeId,
        leaveType: leaveType._id,
        startDate,
        endDate,
        days,
        reason: String(payload.reason || "").trim(),
        status: "Approved",
        approvalStage: "HR",
        decisionBy: employeeId,
        decisionAt: new Date(),
      });
      await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { used: days } });
      await this.recordEvent({ company, leaveRequest: request._id, actor: employeeId, type: "leave.auto_approved", title: "Leave request approved", description: `${leaveType.name} leave was automatically approved.`, toStatus: "Approved" });
      return this.getRequest(request._id, company, employeeId);
    }

    const { supervisor, sbuHead } = await resolveApprovalChain(employee);
    if (!supervisor) throw fail("Your line manager/supervisor is not configured. Ask an administrator to set your Reports To employee before applying for leave.", 422);
    if (!sbuHead) throw fail("Your SBU Head is not configured. Ask an administrator to assign the head of your SBU before applying for leave.", 422);

    const supervisorIsSbuHead = String(supervisor._id) === String(sbuHead._id);
    const request = await LeaveRequest.create({
      company,
      employee: employeeId,
      leaveType: leaveType._id,
      startDate,
      endDate,
      days,
      reason: String(payload.reason || "").trim(),
      status: "Pending",
      approvalStage: supervisorIsSbuHead ? "SBU_HEAD" : "SUPERVISOR",
      supervisor: supervisor._id,
      sbuHead: sbuHead._id,
      approver: supervisorIsSbuHead ? sbuHead._id : supervisor._id,
    });

    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: days } });
    await this.recordEvent({
      company,
      leaveRequest: request._id,
      actor: employeeId,
      type: "leave.created",
      title: "Leave request submitted",
      description: `${leaveType.name} request for ${days} working day(s) entered the approval workflow.`,
      toStatus: "Pending",
      metadata: { stage: request.approvalStage, supervisor: supervisor._id, sbuHead: sbuHead._id },
    });

    await NotificationService.create({
      company,
      recipient: request.approver,
      type: "leave",
      title: supervisorIsSbuHead ? "Leave approval required — SBU Head" : "Leave approval required — Line Manager",
      message: `${employee.firstName} ${employee.lastName} submitted a ${leaveType.name} leave request for ${days} working day(s).`,
      link: `/leave/requests/${request._id}`,
      data: { resourceType: "leave", resourceId: request._id.toString(), stage: request.approvalStage },
      createdBy: employeeId,
    });

    return this.getRequest(request._id, company, employeeId);
  }

  async listRequests(company, employeeId, mode = "mine") {
    const filter = { company, isActive: true, deletedAt: null };
    if (mode === "pending") {
      filter.approver = employeeId;
      filter.status = "Pending";
    } else if (mode === "all") {
      // management view
    } else {
      filter.employee = employeeId;
    }

    return LeaveRequest.find(filter)
      .populate("employee", "_id firstName lastName email employeeNo")
      .populate("leaveType", "_id name code paid")
      .populate("supervisor", "_id firstName lastName")
      .populate("sbuHead", "_id firstName lastName")
      .populate("approver", "_id firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async getRequest(id, company, employeeId = null) {
    const request = await LeaveRequest.findOne({ _id: id, company, isActive: true, deletedAt: null })
      .populate("employee", "_id firstName lastName email employeeNo position reportsTo")
      .populate("leaveType")
      .populate("supervisor", "_id firstName lastName email")
      .populate("sbuHead", "_id firstName lastName email")
      .populate("approver", "_id firstName lastName email")
      .populate("decisionBy", "_id firstName lastName email")
      .lean();

    if (!request) throw fail("Leave request not found", 404);

    const events = await LeaveEvent.find({ company, leaveRequest: id })
      .populate("actor", "_id firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return { request, events };
  }

  async canAct(requestId, company, employeeId) {
    const request = await LeaveRequest.findOne({ _id: requestId, company, isActive: true, deletedAt: null });
    if (!request || request.status !== "Pending") return false;
    if (String(request.approver || "") === String(employeeId)) return true;

    const employee = await Employee.findOne({ _id: employeeId, company, active: true, deletedAt: null }).populate("role");
    const permissions = employee?.role?.permissions || [];
    return permissions.includes("leave.approve") || permissions.includes("leave.manage") || permissions.includes("*");
  }

  async notifyHr(company, request, actorId) {
    const hrDepartment = await Department.findOne({ company, code: "HR", active: true, deletedAt: null }).populate("head", "_id firstName lastName email");
    const hrHead = hrDepartment?.head;
    if (!hrHead || String(hrHead._id) === String(request.employee)) return;

    await NotificationService.create({
      company,
      recipient: hrHead._id,
      type: "leave",
      title: "Leave approved — HR filing",
      message: "A leave request has completed supervisor and SBU Head approval and is ready for HR filing.",
      link: `/leave/requests/${request._id}`,
      data: { resourceType: "leave", resourceId: request._id.toString(), stage: "HR" },
      createdBy: actorId,
    });
  }

  async decide(company, requestId, actorId, decision, comment = "") {
    const request = await LeaveRequest.findOne({ _id: requestId, company, isActive: true, deletedAt: null })
      .populate("employee", "_id firstName lastName")
      .populate("leaveType", "_id name")
      .populate("supervisor", "_id firstName lastName")
      .populate("sbuHead", "_id firstName lastName");

    if (!request) throw fail("Leave request not found", 404);
    if (!(await this.canAct(requestId, company, actorId))) throw fail("You are not authorized to decide this leave request", 403);

    const normalized = decision === "approve" ? "Approved" : "Rejected";
    if (normalized === "Rejected" && !String(comment || "").trim()) throw fail("A rejection reason is required");

    const fromStatus = request.status;
    const actorName = request.approvalStage === "SUPERVISOR" ? "line manager" : "SBU Head";

    if (normalized === "Rejected") {
      request.status = "Rejected";
      request.decisionBy = actorId;
      request.decisionAt = new Date();
      request.decisionComment = String(comment || "").trim();
      await request.save();

      const balance = await ensureBalance(company, request.employee._id, request.leaveType, request.startDate.getFullYear());
      await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days } });
      await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.rejected", title: "Leave request rejected", description: `The ${actorName} rejected the leave request.`, fromStatus, toStatus: "Rejected", comment: request.decisionComment, metadata: { stage: request.approvalStage } });
      await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: "Leave request rejected", message: `Your ${request.leaveType.name} leave request was rejected.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString() }, createdBy: actorId });
      return this.getRequest(request._id, company, actorId);
    }

    if (request.approvalStage === "SUPERVISOR") {
      request.supervisorDecisionAt = new Date();
      request.approvalStage = "SBU_HEAD";
      request.approver = request.sbuHead;
      await request.save();

      await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.supervisor_approved", title: "Line manager approved", description: "The line manager approved the leave request and forwarded it to the SBU Head.", fromStatus, toStatus: "Pending", comment: String(comment || "").trim() || null, metadata: { nextStage: "SBU_HEAD" } });
      await NotificationService.create({ company, recipient: request.sbuHead, type: "leave", title: "Leave approval required — SBU Head", message: `${request.employee.firstName} ${request.employee.lastName}'s leave request is waiting for your approval.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "SBU_HEAD" }, createdBy: actorId });
      return this.getRequest(request._id, company, actorId);
    }

    request.sbuHeadDecisionAt = new Date();
    request.approvalStage = "HR";
    request.status = "Approved";
    request.approver = null;
    request.decisionBy = actorId;
    request.decisionAt = new Date();
    request.decisionComment = String(comment || "").trim() || null;
    await request.save();

    const balance = await ensureBalance(company, request.employee._id, request.leaveType, request.startDate.getFullYear());
    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days, used: request.days } });
    await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.sbu_head_approved", title: "SBU Head approved", description: "The SBU Head approved the leave request. It is now ready for HR filing.", fromStatus, toStatus: "Approved", comment: request.decisionComment, metadata: { nextStage: "HR" } });
    await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: "Leave approved — submit to HR", message: `Your ${request.leaveType.name} leave request has received supervisor and SBU Head approval.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "HR" }, createdBy: actorId });
    await this.notifyHr(company, request, actorId);

    return this.getRequest(request._id, company, actorId);
  }

  async cancel(company, requestId, employeeId) {
    const request = await LeaveRequest.findOne({ _id: requestId, company, employee: employeeId, isActive: true, deletedAt: null }).populate("leaveType");
    if (!request) throw fail("Leave request not found", 404);
    if (!["Pending", "Approved"].includes(request.status)) throw fail("This leave request cannot be cancelled");

    const fromStatus = request.status;
    const balance = await ensureBalance(company, employeeId, request.leaveType, request.startDate.getFullYear());
    if (request.status === "Pending") await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days } });
    if (request.status === "Approved") await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { used: -request.days } });

    request.status = "Cancelled";
    request.approver = null;
    await request.save();
    await this.recordEvent({ company, leaveRequest: request._id, actor: employeeId, type: "leave.cancelled", title: "Leave request cancelled", description: "The employee cancelled the leave request.", fromStatus, toStatus: "Cancelled" });
    return this.getRequest(request._id, company, employeeId);
  }
}

export default new LeaveService();
