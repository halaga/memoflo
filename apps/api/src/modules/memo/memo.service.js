import MemoRepository from "./memo.repository.js";
import { validateCreateMemo } from "./memo.validator.js";
import Workflow from "../workflow/workflow.model.js";
import BusinessService from "../business-service/businessService.model.js";

class MemoService {
  async generateReferenceNo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `MEM-${year}-${random}`;
  }

  async createMemo(payload) {
    validateCreateMemo(payload);

    const service = await BusinessService.findOne({
      _id: payload.businessService,
      company: payload.company,
      active: true,
      isActive: true,
    });

    if (!service) throw new Error("Business service not found for this company");

    if (payload.workflow) {
      const workflow = await Workflow.findOne({
        _id: payload.workflow,
        company: payload.company,
        active: true,
        isActive: true,
      });
      if (!workflow) throw new Error("Selected workflow not found for this company");
    } else if (service.workflow) {
      payload.workflow = service.workflow;
    } else {
      const defaultWorkflow = await Workflow.findOne({
        company: payload.company,
        code: "PROCUREMENT",
        active: true,
        isActive: true,
      });
      if (defaultWorkflow) payload.workflow = defaultWorkflow._id;
    }

    payload.referenceNo = await this.generateReferenceNo();
    payload.status = "Draft";
    payload.currentStep = 0;

    return MemoRepository.create(payload);
  }

  async listMemos(companyId) {
    return MemoRepository.findAll(companyId);
  }

  async getMemo(id, companyId) {
    const memo = await MemoRepository.findById(id, companyId);
    if (!memo) throw new Error("Memo not found");
    return memo;
  }

  async updateMemo(id, companyId, payload) {
    const memo = await MemoRepository.update(id, companyId, payload);
    if (!memo) throw new Error("Memo not found");
    return memo;
  }
}

export default new MemoService();
