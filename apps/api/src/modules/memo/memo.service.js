import MemoRepository from "./memo.repository.js";
import BusinessService from "../business-service/businessService.model.js";
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
      throw new Error("Business service not found");
    }

    return MemoRepository.create({
      ...payload,
      referenceNo: await this.generateReferenceNo(),
      workflow: payload.workflow || businessService.workflow || null,
      status: "Draft",
      currentStep: 0,
    });
  }

  async listMemos(companyId) {
    return MemoRepository.findAll(companyId);
  }

  async getMemo(id, companyId) {
    const memo = await MemoRepository.findById(id, companyId);

    if (!memo) {
      throw new Error("Memo not found");
    }

    return memo;
  }

  async updateMemo(id, companyId, payload) {
    const memo = await MemoRepository.update(id, companyId, payload);

    if (!memo) {
      throw new Error("Memo not found");
    }

    return memo;
  }
}

export default new MemoService();
