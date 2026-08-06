import MemoRepository from "./memo.repository.js";
import { validateCreateMemo } from "./memo.validator.js";

class MemoService {
  async generateReferenceNo() {
    const year = new Date().getFullYear();

    const random = Math.floor(
      100000 + Math.random() * 900000
    );

    return `MEM-${year}-${random}`;
  }

  async createMemo(payload) {
    validateCreateMemo(payload);

    payload.referenceNo =
      await this.generateReferenceNo();

    payload.status = "Draft";

    payload.currentStep = 0;

    return MemoRepository.create(payload);
  }

  async listMemos(companyId) {
    return MemoRepository.findAll(companyId);
  }

  async getMemo(id) {
    return MemoRepository.findById(id);
  }

  async updateMemo(id, payload) {
    return MemoRepository.update(id, payload);
  }
}

export default new MemoService();