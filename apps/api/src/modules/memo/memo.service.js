import BusinessService from "../business-service/businessService.model.js";
import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import MemoRepository from "./memo.repository.js";
import { validateCreateMemo } from "./memo.validator.js";

class MemoService {
  async generateReferenceNo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `MEM-${year}-${random}`;
  }

  async createMemo(payload) {
    validateCreateMemo(payload);

    const businessService = await BusinessService.findOne({
      _id: payload.businessService,
      company: payload.company,
      active: true,
      isActive: true,
      deletedAt: null,
    }).lean();
    if (!businessService) throw Object.assign(new Error("Business service not found"), { status: 404 });

    const memoType = payload.memoType || "simple";
    let recipient = null;
    if (payload.recipient) {
      recipient = await Employee.findOne({ _id: payload.recipient, company: payload.company, active: true, isActive: true, employmentStatus: "Active" }).select("_id firstName lastName").lean();
      if (!recipient) throw Object.assign(new Error("Recipient not found"), { status: 404 });
    }

    const memo = await MemoRepository.create({
      ...payload,
      memoType,
      recipient: recipient?._id || null,
      referenceNo: await this.generateReferenceNo(),
      workflow: memoType === "simple" ? null : (payload.workflow || businessService.workflow || null),
      status: memoType === "simple" ? "Completed" : "Draft",
      currentStep: 0,
    });

    await MemoEventService.record({
      company: payload.company,
      memo: memo._id,
      actor: payload.createdBy,
      type: "memo.created",
      title: "Memo created",
      description: `Memo ${memo.referenceNo} was created.`,
      toStatus: memo.status,
      metadata: { referenceNo: memo.referenceNo, memoType },
    });

    if (memoType === "simple" && recipient) {
      await NotificationService.create({
        company: payload.company,
        recipient: recipient._id,
        type: "memo",
        title: "New memo received",
        message: `${memo.referenceNo}: ${memo.title}`,
        link: `/memos/${memo._id}`,
        data: { resourceType: "memo", resourceId: String(memo._id) },
        createdBy: payload.createdBy,
      });
      await MemoEventService.record({
        company: payload.company,
        memo: memo._id,
        actor: payload.createdBy,
        type: "memo.delivered",
        title: "Memo delivered",
        description: `Memo ${memo.referenceNo} was delivered to the recipient.`,
        toStatus: "Completed",
        metadata: { recipient: String(recipient._id) },
      });
    }

    return memo;
  }

  async listMemos(companyId) { return MemoRepository.findAll(companyId); }
  async getMemo(id, companyId) {
    const memo = await MemoRepository.findById(id, companyId);
    if (!memo) throw Object.assign(new Error("Memo not found"), { status: 404 });
    return memo;
  }

  async updateMemo(id, companyId, payload, actorId) {
    const existing = await MemoRepository.findById(id, companyId);
    if (!existing) throw Object.assign(new Error("Memo not found"), { status: 404 });
    const allowed = ["title", "body", "category", "priority", "beneficiarySBU"];
    const updates = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
    const memo = await MemoRepository.update(id, companyId, updates);
    const changedFields = Object.keys(updates).filter((field) => String(existing[field] ?? "") !== String(memo[field] ?? ""));
    if (changedFields.length) await MemoEventService.record({ company: companyId, memo: memo._id, actor: actorId, type: "memo.updated", title: "Memo updated", description: `Memo ${memo.referenceNo} was updated.`, metadata: { referenceNo: memo.referenceNo, changedFields } });
    return memo;
  }
}
export default new MemoService();
