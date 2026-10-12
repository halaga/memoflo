import BusinessService from "../business-service/businessService.model.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import MemoRepository from "./memo.repository.js";
import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import { validateCreateMemo } from "./memo.validator.js";

class MemoService {
  async generateReferenceNo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `MEM-${year}-${random}`;
  }

  async createMemo(payload) {
    validateCreateMemo(payload);

    const simple = payload.memoType === "simple";
    let businessService = null;

    if (!simple) {
      businessService = await BusinessService.findOne({
        _id: payload.businessService,
        company: payload.company,
        active: true,
        isActive: true,
        deletedAt: null,
      }).lean();

      if (!businessService) {
        const error = new Error("Business service not found");
        error.status = 404;
        throw error;
      }
    }

    const recipientIds = Array.isArray(payload.recipients) ? [...new Set(payload.recipients.map(String))] : [];
    if (payload.memoType === "simple") {
      const recipients = await Employee.find({ _id: { $in: recipientIds }, company: payload.company, active: true, deletedAt: null }).select("_id");
      if (recipients.length !== recipientIds.length) { const e=new Error("One or more recipients do not belong to this company"); e.status=400; throw e; }
    }
    const memo = await MemoRepository.create({ ...payload, businessService: simple ? null : payload.businessService, recipients: recipientIds, referenceNo: await this.generateReferenceNo(), workflow: simple ? null : (payload.workflow || businessService?.workflow || null), status: simple ? "Completed" : "Draft", currentStep: 0 });
    if (simple) {
      await Promise.all(recipientIds.map(recipient => NotificationService.create({ company: payload.company, recipient, type: "memo", title: `New memo: ${memo.title}`, message: `You received ${memo.referenceNo} from your colleague.`, link: `/memos/${memo._id}`, createdBy: payload.createdBy })));
    }

    await MemoEventService.record({
      company: payload.company,
      memo: memo._id,
      actor: payload.createdBy,
      type: "memo.created",
      title: "Memo created",
      description: `Memo ${memo.referenceNo} was created.`,
      toStatus: simple ? "Completed" : "Draft",
      metadata: { referenceNo: memo.referenceNo },
    });

    return memo;
  }

  async listMemos(companyId) {
    return MemoRepository.findAll(companyId);
  }

  async getMemo(id, companyId) {
    const memo = await MemoRepository.findById(id, companyId);

    if (!memo) {
      const error = new Error("Memo not found");
      error.status = 404;
      throw error;
    }

    return memo;
  }

  async updateMemo(id, companyId, payload, actorId) {
    const existing = await MemoRepository.findById(id, companyId);

    if (!existing) {
      const error = new Error("Memo not found");
      error.status = 404;
      throw error;
    }

    const allowed = ["title", "body", "category", "priority", "beneficiarySBU"];
    const updates = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowed.includes(key))
    );

    const memo = await MemoRepository.update(id, companyId, updates);

    const changedFields = Object.keys(updates).filter(
      (field) => String(existing[field] ?? "") !== String(memo[field] ?? "")
    );

    if (changedFields.length) {
      await MemoEventService.record({
        company: companyId,
        memo: memo._id,
        actor: actorId,
        type: "memo.updated",
        title: "Memo updated",
        description: `Memo ${memo.referenceNo} was updated.`,
        metadata: { referenceNo: memo.referenceNo, changedFields },
      });
    }

    return memo;
  }
}

export default new MemoService();
