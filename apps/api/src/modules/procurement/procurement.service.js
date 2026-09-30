import mongoose from "mongoose";

import ProcurementRequest from "./procurement.model.js";
import Employee from "../employee/employee.model.js";
import Role from "../auth/role.model.js";
import Department from "../organization/department/department.model.js";
import SBU from "../organization/sbu/sbu.model.js";
import Position from "../position/position.model.js";
import NotificationService from "../notification/notification.service.js";
import AuditService from "../audit/audit.service.js";

const STAGES = {
  SBU_HEAD: "PENDING_SBU_HEAD",
  ADMIN: "PENDING_ADMIN",
  ICC: "PENDING_ICC",
  FINANCE: "PENDING_SBU_FINANCE",
  CEO: "PENDING_CEO",
  PAYMENT: "PENDING_PAYMENT",
};

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validId(value, label) {
  if (!mongoose.isValidObjectId(value)) throw fail(`${label} is invalid`);
}

function actorName(employee) {
  return `${employee?.firstName || "Employee"} ${employee?.lastName || ""}`.trim();
}

function normalizeItems(items = []) {
  if (!Array.isArray(items) || !items.length) throw fail("Add at least one procurement item.");
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const estimatedUnitCost = Number(item.estimatedUnitCost || 0);
    if (!item.description?.trim()) throw fail("Every item needs a description.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw fail("Item quantity must be greater than zero.");
    if (!Number.isFinite(estimatedUnitCost) || estimatedUnitCost < 0) throw fail("Item estimated cost is invalid.");
    return {
      description: item.description.trim(),
      quantity,
      unit: item.unit?.trim() || "item",
      estimatedUnitCost,
      estimatedTotal: quantity * estimatedUnitCost,
    };
  });
}

async function employeesWithPermission(companyId, permission) {
  const roles = await Role.find({ company: companyId, permissions: permission, isActive: true, deletedAt: null }).select("_id").lean();
  if (!roles.length) return [];
  return Employee.find({ company: companyId, role: { $in: roles.map((role) => role._id) }, active: true, isActive: true, employmentStatus: "Active", loginEnabled: true })
    .select("_id firstName lastName email position")
    .sort({ createdAt: 1 });
}

async function resolveDepartment(companyId, employee) {
  if (!employee?.position) throw fail("Your position is not configured. Assign your position before creating a procurement request.", 422);
  const position = await Position.findOne({ _id: employee.position, company: companyId, active: true, isActive: true, deletedAt: null })
    .populate("department", "_id name code head")
    .populate("sbu", "_id name code head");
  if (!position?.department) throw fail("Your position must have a department before creating a procurement request.", 422);
  return { position, department: position.department, sbu: position.sbu || null };
}

async function nextHandler(companyId, permission, label) {
  const employees = await employeesWithPermission(companyId, permission);
  if (!employees[0]) throw fail(`No active ${label} is configured. Assign the ${permission} permission to an active employee.`, 422);
  return employees[0];
}

async function logEvent({ company, actor, request, action, description, metadata = {}, outcome = "success" }) {
  await AuditService.record({
    company,
    actor,
    action,
    resourceType: "procurement",
    resourceId: String(request._id),
    method: "WORKFLOW",
    path: "/procurement",
    outcome,
    statusCode: outcome === "success" ? 200 : 400,
    metadata: { requestNo: request.requestNo, description, ...metadata },
  });
}

async function notify({ company, recipient, request, title, message, stage }) {
  if (!recipient) return;
  await NotificationService.create({
    company,
    recipient,
    type: "procurement",
    title,
    message,
    link: `/procurement/requests/${request._id}`,
    data: { resourceType: "procurement", resourceId: String(request._id), stage },
    createdBy: request.requester,
  });
}

function populate(query) {
  return query
    .populate("requester", "_id employeeNo firstName lastName email position")
    .populate("requestingDepartment", "_id name code")
    .populate("requestingSbu", "_id name code head")
    .populate("currentHandler", "_id employeeNo firstName lastName email")
    .populate("participants.requestingSbuHead.employee", "_id firstName lastName email")
    .populate("participants.adminDispatcher.employee", "_id firstName lastName email")
    .populate("participants.iccEvaluator.employee", "_id firstName lastName email")
    .populate("participants.sbuFinanceApprover.employee", "_id firstName lastName email")
    .populate("participants.ceoApprover.employee", "_id firstName lastName email");
}

class ProcurementService {
  async list(companyId, employeeId, mode = "mine") {
    const query = { company: companyId, isActive: true, deletedAt: null };
    if (mode === "approvals") query.currentHandler = employeeId;
    else if (mode === "mine") query.requester = employeeId;
    return populate(ProcurementRequest.find(query).sort({ createdAt: -1 }).limit(100)).lean();
  }

  async get(id, companyId) {
    validId(id, "Procurement request id");
    const request = await populate(ProcurementRequest.findOne({ _id: id, company: companyId, isActive: true, deletedAt: null })).lean();
    if (!request) throw fail("Procurement request not found", 404);
    return request;
  }

  async create(companyId, employeeId, payload) {
    const employee = await Employee.findOne({ _id: employeeId, company: companyId, active: true, isActive: true, employmentStatus: "Active" });
    if (!employee) throw fail("Employee not found", 404);
    const { department, sbu } = await resolveDepartment(companyId, employee);
    const requestScope = payload.requestScope === "company" ? "company" : "sbu";
    let sbuHead = null;
    if (requestScope === "sbu") {
      if (!sbu) throw fail("This request needs an SBU, but your position is not assigned to one. Choose a company-level request or configure your position SBU.", 422);
      sbuHead = await SBU.findOne({ _id: sbu._id, company: companyId, isActive: true, deletedAt: null }).populate("head", "_id firstName lastName email");
      if (!sbuHead?.head) throw fail(`The ${sbu.name} SBU Head is not configured. Configure it before creating procurement requests.`, 422);
    }

    const admin = await nextHandler(companyId, "procurement.dispatch", "procurement dispatcher");
    const icc = await nextHandler(companyId, "procurement.evaluate", "ICC evaluator");
    const finance = await nextHandler(companyId, "procurement.finance", "SBU finance approver");
    const ceo = await nextHandler(companyId, "procurement.approve", "CEO approver");
    const items = normalizeItems(payload.items);
    const estimatedAmount = items.reduce((sum, item) => sum + item.estimatedTotal, 0);

    const count = await ProcurementRequest.countDocuments({ company: companyId });
    const requestNo = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const request = await ProcurementRequest.create({
      company: companyId,
      requestNo,
      title: payload.title?.trim(),
      description: payload.description?.trim() || "",
      requester: employeeId,
      requestingDepartment: department._id,
      requestingSbu: sbu?._id || null,
      requestScope,
      category: payload.category?.trim() || "General",
      urgency: payload.urgency || "Normal",
      neededBy: payload.neededBy || null,
      currency: payload.currency || "NGN",
      estimatedAmount,
      items,
      stage: requestScope === "company" ? STAGES.ADMIN : STAGES.SBU_HEAD,
      currentHandler: requestScope === "company" ? admin._id : sbuHead.head._id,
      participants: {
        requestingSbuHead: { employee: sbuHead?.head?._id || null },
        adminDispatcher: { employee: admin._id },
        iccEvaluator: { employee: icc._id },
        sbuFinanceApprover: { employee: finance._id },
        ceoApprover: { employee: ceo._id },
      },
    });

    await logEvent({ company: companyId, actor: employeeId, request, action: "procurement.created", description: requestScope === "company" ? "Company-level purchase request created and routed to Administration." : "Procurement request created and routed to the requesting SBU Head.", metadata: { requestScope } });
    await notify({ company: companyId, recipient: request.currentHandler, request, title: requestScope === "company" ? "Company purchase review required" : "Procurement review required", message: requestScope === "company" ? `${actorName(employee)} submitted ${requestNo} for Administration review.` : `${actorName(employee)} submitted ${requestNo} for your SBU review.`, stage: request.stage });
    return this.get(request._id, companyId);
  }

  async act(id, companyId, actorId, action, payload = {}) {
    const request = await ProcurementRequest.findOne({ _id: id, company: companyId, isActive: true, deletedAt: null })
      .populate("requester", "_id firstName lastName")
      .populate("requestingSbu", "_id name head");
    if (!request) throw fail("Procurement request not found", 404);
    const actor = await Employee.findOne({ _id: actorId, company: companyId }).select("_id firstName lastName email");
    if (!actor) throw fail("Actor not found", 404);

    const reject = async (reason) => {
      if (!reason?.trim()) throw fail("A rejection reason is required.");
      request.stage = "REJECTED";
      request.status = "Rejected";
      request.currentHandler = null;
      request.rejection = { reason: reason.trim(), rejectedAt: new Date(), rejectedBy: actorId };
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.rejected", description: `${actorName(actor)} rejected the procurement request.`, metadata: { reason: reason.trim(), stage: request.stage } });
      await notify({ company: companyId, recipient: request.requester._id, request, title: "Procurement request rejected", message: `${request.requestNo} was rejected: ${reason.trim()}`, stage: "REJECTED" });
      return this.get(id, companyId);
    };

    if (action === "reject") return reject(payload.comment || payload.reason);

    if (String(request.currentHandler) !== String(actorId)) throw fail("This procurement request is not assigned to you.", 403);

    if (request.stage === STAGES.SBU_HEAD && action === "minute") {
      if (!payload.comment?.trim()) throw fail("The SBU Head minute/comment is required.");
      request.sbuHeadMinute = payload.comment.trim();
      request.sbuHeadActionAt = new Date();
      request.stage = STAGES.ADMIN;
      request.currentHandler = request.participants.adminDispatcher.employee;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.sbu_head_minuted", description: "Requesting SBU Head added a minute and forwarded the request to Administration." });
      await notify({ company: companyId, recipient: request.currentHandler, request, title: "Procurement dispatch required", message: `${request.requestNo} has been minuted by the SBU Head and needs Administration dispatch.`, stage: request.stage });
      return this.get(id, companyId);
    }

    if (request.stage === STAGES.ADMIN && action === "dispatch") {
      request.dispatchedAt = new Date();
      request.stage = STAGES.ICC;
      request.currentHandler = request.participants.iccEvaluator.employee;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.dispatched", description: "Administration dispatched the procurement request to ICC for pricing and evaluation." });
      await notify({ company: companyId, recipient: request.currentHandler, request, title: "ICC evaluation required", message: `${request.requestNo} is ready for pricing/evaluation.`, stage: request.stage });
      return this.get(id, companyId);
    }

    if (request.stage === STAGES.ICC && action === "evaluate") {
      const quotedAmount = Number(payload.quotedAmount);
      if (!Number.isFinite(quotedAmount) || quotedAmount < 0) throw fail("Enter a valid quoted amount.");
      if (!payload.recommendation?.trim()) throw fail("ICC recommendation is required.");
      request.iccEvaluation = {
        vendor: payload.vendor?.trim() || "",
        quotedAmount,
        quoteReference: payload.quoteReference?.trim() || "",
        recommendation: payload.recommendation.trim(),
        evaluatedAt: new Date(),
        evaluatedBy: actorId,
      };
      request.stage = STAGES.FINANCE;
      request.currentHandler = request.participants.sbuFinanceApprover.employee;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.icc_evaluated", description: "ICC completed pricing and evaluation." , metadata: { quotedAmount, vendor: request.iccEvaluation.vendor }});
      await notify({ company: companyId, recipient: request.currentHandler, request, title: "SBU Finance approval required", message: `${request.requestNo} has completed ICC evaluation.`, stage: request.stage });
      return this.get(id, companyId);
    }

    if (request.stage === STAGES.FINANCE && action === "finance_approve") {
      const amountApproved = Number(payload.amountApproved);
      if (!Number.isFinite(amountApproved) || amountApproved <= 0) throw fail("Enter a valid approved amount.");
      request.financeApproval = { amountApproved, comment: payload.comment?.trim() || "", approvedAt: new Date(), approvedBy: actorId };
      request.stage = STAGES.CEO;
      request.currentHandler = request.participants.ceoApprover.employee;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.finance_approved", description: "SBU Finance approved the evaluated procurement amount." , metadata: { amountApproved }});
      await notify({ company: companyId, recipient: request.currentHandler, request, title: "CEO approval required", message: `${request.requestNo} is ready for CEO approval.`, stage: request.stage });
      return this.get(id, companyId);
    }

    if (request.stage === STAGES.CEO && action === "ceo_approve") {
      request.ceoApproval = { approvedAt: new Date(), approvedBy: actorId, comment: payload.comment?.trim() || "" };
      request.stage = STAGES.PAYMENT;
      request.status = "Approved";
      request.currentHandler = request.participants.sbuFinanceApprover.employee;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.ceo_approved", description: "CEO approved the procurement request and returned it to SBU Finance for payment." });
      await notify({ company: companyId, recipient: request.currentHandler, request, title: "Procurement ready for payment", message: `${request.requestNo} has CEO approval and is ready for payment.`, stage: request.stage });
      await notify({ company: companyId, recipient: request.requester._id, request, title: "Procurement approved", message: `${request.requestNo} has received CEO approval and is now with Finance for payment.`, stage: request.stage });
      return this.get(id, companyId);
    }

    if (request.stage === STAGES.PAYMENT && action === "mark_paid") {
      const amount = Number(payload.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw fail("Enter a valid payment amount.");
      if (!payload.reference?.trim()) throw fail("Payment reference is required.");
      request.payment = { amount, reference: payload.reference.trim(), note: payload.note?.trim() || "", paidAt: new Date(), paidBy: actorId };
      request.stage = "COMPLETED";
      request.status = "Completed";
      request.currentHandler = null;
      await request.save();
      await logEvent({ company: companyId, actor: actorId, request, action: "procurement.payment_recorded", description: "SBU Finance recorded payment and completed the procurement workflow.", metadata: { amount, reference: request.payment.reference }});
      await notify({ company: companyId, recipient: request.requester._id, request, title: "Procurement completed", message: `${request.requestNo} has been paid and completed.`, stage: request.stage });
      return this.get(id, companyId);
    }

    throw fail(`Action "${action}" is not valid for the current procurement stage.`, 400);
  }
}

export default new ProcurementService();
