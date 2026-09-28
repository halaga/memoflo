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
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days += 1;
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
      }).select("_id firstName lastName email employeeNo position")
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

  const sbu = sbuId
    ? await SBU.findOne({ company: employee.company, _id: sbuId, active: true, deletedAt: null })
        .populate({
          path: "head",
          match: { company: employee.company, active: true, employmentStatus: "Active", deletedAt: null },
          select: "_id firstName lastName email employeeNo position",
        })
    : null;

  const hrDepartment = await Department.findOne({
    company: employee.company,
    code: "HR",
    active: true,
    deletedAt: null,
  }).populate({
    path: "head",
    match: { company: employee.company, active: true, employmentStatus: "Active", deletedAt: null },
    select: "_id firstName lastName email employeeNo position",
  });

  return {
    supervisor,
    sbu: sbu || null,
    sbuHead: sbu?.head || null,
    hrHead: hrDepartment?.head || null,
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
  async recordEvent(payload) {
    return LeaveEvent.create(payload);
  }

  async listTypes(company) {
    return LeaveType.find({ company, active: true, isActive: true, deletedAt: null })
      .sort({ name: 1 })
      .lean();
  }

  async createType(company, payload) {
    return LeaveType.create({
      company,
      name: String(payload.name || "").trim(),
      code: String(payload.code || "").trim().toUpperCase(),
      daysPerYear: Math.max(0, Number(payload.daysPerYear || 0)),
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
          daysPerYear: Math.max(0, Number(payload.daysPerYear || 0)),
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
    return Promise.all(types.map(async (type) => ({
      ...type,
      balance: await ensureBalance(company, employeeId, type, Number(year)),
    })));
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
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      throw fail("Choose a valid leave period.");
    }
    if (startDate < cleanDate(new Date())) throw fail("Leave cannot start in the past");
    if (startDate.getFullYear() !== endDate.getFullYear()) throw fail("Leave cannot span two calendar years");

    const calculatedDays = businessDays(startDate, endDate);
    const durationMode = payload.durationMode === "custom" ? "custom" : "dates";
    const customDays = Number(payload.customDays);
    const days = durationMode === "custom" ? customDays : calculatedDays;

    if (!Number.isFinite(days) || days <= 0 || days > 365) throw fail("Leave duration must be between 0.5 and 365 days.");
    if (durationMode === "custom" && !Number.isInteger(days * 2)) throw fail("Custom leave days can be entered in half-day increments.");
    if (durationMode === "dates" && !calculatedDays) throw fail("Leave dates must contain at least one working day");

    const overlap = await LeaveRequest.exists({
      company,
      employee: employeeId,
      status: { $in: ["Pending", "Approved", "HR Filed"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      isActive: true,
      deletedAt: null,
    });
    if (overlap) throw fail("You already have a pending or approved leave covering part of these dates");

    const balance = await ensureBalance(company, employeeId, leaveType, startDate.getFullYear());
    const available = Number(balance.allocated) - Number(balance.used) - Number(balance.pending);
    if (days > available) throw fail(`Insufficient ${leaveType.name} balance. Available: ${available} day(s).`);

    if (!leaveType.requiresApproval) {
      const request = await LeaveRequest.create({
        company, employee: employeeId, leaveType: leaveType._id, startDate, endDate, days,
        reason: String(payload.reason || "").trim(), status: "Approved", approvalStage: "HR",
        decisionBy: employeeId, decisionAt: new Date(), durationMode, customDays: durationMode === "custom" ? days : null,
      });
      await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { used: days } });
      await this.recordEvent({ company, leaveRequest: request._id, actor: employeeId, type: "leave.auto_approved", title: "Leave request approved", description: `${leaveType.name} leave was automatically approved.`, toStatus: "Approved" });
      return this.getRequest(request._id, company, employeeId);
    }

    const { supervisor, sbu, sbuHead, hrHead } = await resolveApprovalChain(employee);
    if (!supervisor) throw fail("Your line manager is not configured. Set the employee's Reports To before applying for leave.", 422);
    if (!sbu) throw fail("Your position is not assigned to an SBU. Assign the employee to a position with an SBU before applying for leave.", 422);
    if (!sbuHead) throw fail(`The ${sbu.name} SBU Head is not configured. Assign an SBU Head before applying for leave.`, 422);

    const supervisorIsSbuHead = String(supervisor._id) === String(sbuHead._id);
    const request = await LeaveRequest.create({
      company, employee: employeeId, leaveType: leaveType._id, startDate, endDate, days,
      reason: String(payload.reason || "").trim(), status: "Pending",
      approvalStage: supervisorIsSbuHead ? "SBU_HEAD" : "SUPERVISOR",
      supervisor: supervisor._id, sbuHead: sbuHead._id, approver: supervisorIsSbuHead ? sbuHead._id : supervisor._id,
      durationMode, customDays: durationMode === "custom" ? days : null,
    });

    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: days } });
    await this.recordEvent({
      company, leaveRequest: request._id, actor: employeeId, type: "leave.created", title: "Leave request submitted",
      description: `${leaveType.name} request for ${days} day(s) entered the approval workflow.`, toStatus: "Pending",
      metadata: { stage: request.approvalStage, supervisor: supervisor._id, sbuHead: sbuHead._id, hrHead: hrHead?._id || null },
    });

    await NotificationService.create({
      company, recipient: request.approver, type: "leave",
      title: supervisorIsSbuHead ? "Leave approval required — SBU Head" : "Leave approval required — Line Manager",
      message: `${employee.firstName} ${employee.lastName} submitted ${leaveType.name} for ${days} day(s).`,
      link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: request.approvalStage }, createdBy: employeeId,
    });

    return this.getRequest(request._id, company, employeeId);
  }

  async listRequests(company, employeeId, mode = "mine") {
    const filter = { company, isActive: true, deletedAt: null };
    if (mode === "pending") {
      filter.approver = employeeId;
      filter.status = "Pending";
    } else if (mode === "all") {
      // leave.manage is enforced by the controller.
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

  async getRequest(id, company) {
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
    if (!request) return false;
    if (request.approvalStage === "HR") {
      const employee = await Employee.findOne({ _id: employeeId, company, active: true, deletedAt: null }).populate("role");
      const permissions = employee?.role?.permissions || [];
      return permissions.includes("leave.manage") || permissions.includes("*");
    }
    if (request.status !== "Pending") return false;
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
      company, recipient: hrHead._id, type: "leave", title: "Leave approved — HR filing",
      message: "A leave request has completed supervisor and SBU Head approval and is ready for HR filing.",
      link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "HR" }, createdBy: actorId,
    });
  }

  async decide(company, requestId, actorId, decision, comment = "") {
    const request = await LeaveRequest.findOne({ _id: requestId, company, isActive: true, deletedAt: null })
      .populate("employee", "_id firstName lastName")
      .populate("leaveType", "_id name")
      .populate("supervisor", "_id firstName lastName")
      .populate("sbuHead", "_id firstName lastName");

    if (!request) throw fail("Leave request not found", 404);
    if (!(await this.canAct(requestId, company, actorId))) throw fail("You are not authorized to act on this leave request", 403);

    const cleanComment = String(comment || "").trim();
    if (request.approvalStage === "HR") {
      if (decision !== "file") throw fail("HR can only mark an approved leave as filed.");
      request.status = "HR Filed";
      request.approver = null;
      request.decisionBy = actorId;
      request.decisionAt = new Date();
      request.decisionComment = cleanComment || null;
      await request.save();
      await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.hr_filed", title: "HR filed leave request", description: "HR recorded the approved leave request as filed.", fromStatus: "Approved", toStatus: "HR Filed", comment: cleanComment || null });
      await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: "Leave filed by HR", message: `Your ${request.leaveType.name} request has been filed by HR.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "HR" }, createdBy: actorId });
      return this.getRequest(request._id, company);
    }

    const normalized = decision === "approve" ? "Approved" : "Rejected";
    if (normalized === "Rejected" && !cleanComment) throw fail("A rejection reason is required");
    const fromStatus = request.status;
    const actorName = request.approvalStage === "SUPERVISOR" ? "line manager" : "SBU Head";

    if (normalized === "Rejected") {
      request.status = "Rejected";
      request.decisionBy = actorId;
      request.decisionAt = new Date();
      request.decisionComment = cleanComment;
      await request.save();
      const balance = await ensureBalance(company, request.employee._id, request.leaveType, request.startDate.getFullYear());
      await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days } });
      await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.rejected", title: "Leave request rejected", description: `The ${actorName} rejected the leave request.`, fromStatus, toStatus: "Rejected", comment: cleanComment, metadata: { stage: request.approvalStage } });
      await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: "Leave request rejected", message: `Your ${request.leaveType.name} leave request was rejected.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString() }, createdBy: actorId });
      return this.getRequest(request._id, company);
    }

    if (request.approvalStage === "SUPERVISOR") {
      request.supervisorDecisionAt = new Date();
      request.approvalStage = "SBU_HEAD";
      request.approver = request.sbuHead;
      await request.save();
      await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.supervisor_approved", title: "Line manager approved", description: "The line manager consented and forwarded the request to the SBU Head.", fromStatus, toStatus: "Pending", comment: cleanComment || null, metadata: { nextStage: "SBU_HEAD" } });
      await NotificationService.create({ company, recipient: request.sbuHead, type: "leave", title: "Leave approval required — SBU Head", message: `${request.employee.firstName} ${request.employee.lastName}'s leave request is waiting for your approval.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "SBU_HEAD" }, createdBy: actorId });
      return this.getRequest(request._id, company);
    }

    request.sbuHeadDecisionAt = new Date();
    request.approvalStage = "HR";
    request.status = "Approved";
    request.approver = null;
    request.decisionBy = actorId;
    request.decisionAt = new Date();
    request.decisionComment = cleanComment || null;
    await request.save();

    const balance = await ensureBalance(company, request.employee._id, request.leaveType, request.startDate.getFullYear());
    await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -request.days, used: request.days } });
    await this.recordEvent({ company, leaveRequest: request._id, actor: actorId, type: "leave.sbu_head_approved", title: "SBU Head approved", description: "The SBU Head approved the request. It is now ready for HR filing.", fromStatus, toStatus: "Approved", comment: cleanComment || null, metadata: { nextStage: "HR" } });
    await NotificationService.create({ company, recipient: request.employee._id, type: "leave", title: "Leave approved — submit to HR", message: `Your ${request.leaveType.name} leave request has received line manager and SBU Head approval.`, link: `/leave/requests/${request._id}`, data: { resourceType: "leave", resourceId: request._id.toString(), stage: "HR" }, createdBy: actorId });
    await this.notifyHr(company, request, actorId);
    return this.getRequest(request._id, company);
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
    return this.getRequest(request._id, company);
  }
}

export default new LeaveService();
