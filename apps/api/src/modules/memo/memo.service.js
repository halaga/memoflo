import BusinessService from "../business-service/businessService.model.js";
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

    if (!businessService) {
      const error = new Error("Business service not found");
      error.status = 404;
      throw error;
    }

    const memo = await MemoRepository.create({
      ...payload,
      referenceNo: await this.generateReferenceNo(),
      workflow: payload.workflow || businessService.workflow || null,
      status: "Draft",
      currentStep: 0,
    });

    await MemoEventService.record({
      company: payload.company,
      memo: memo._id,
      actor: payload.createdBy,
      type: "memo.created",
      title: "Memo created",
      description: `Memo ${memo.referenceNo} was created.`,
      toStatus: "Draft",
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
