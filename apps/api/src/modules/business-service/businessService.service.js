import BusinessServiceRepository from "./businessService.repository.js";
import WorkflowRepository from "../workflow/workflow.repository.js";
import {
  validateCreateBusinessService,
} from "./businessService.validator.js";

class BusinessServiceService {
  async createBusinessService(
    companyId,
    payload
  ) {
    validateCreateBusinessService(payload);

    return BusinessServiceRepository.create({
      ...payload,
      company: companyId,
    });
  }

  async listBusinessServices(companyId) {
    return BusinessServiceRepository.findAll(
      companyId
    );
  }

  async getBusinessService(
    companyId,
    id
  ) {
    const businessService =
      await BusinessServiceRepository.findById(
        id,
        companyId
      );

    if (!businessService) {
      throw new Error(
        "Business service not found"
      );
    }

    return businessService;
  }

  async getBusinessServiceBySlug(
    companyId,
    slug
  ) {
    const businessService =
      await BusinessServiceRepository.findBySlug(
        slug,
        companyId
      );

    if (!businessService) {
      throw new Error(
        "Business service not found"
      );
    }

    return businessService;
  }

  async updateBusinessService(
    companyId,
    id,
    payload
  ) {
    const businessService =
      await BusinessServiceRepository.update(
        id,
        companyId,
        payload
      );

    if (!businessService) {
      throw new Error(
        "Business service not found"
      );
    }

    return businessService;
  }

  async deleteBusinessService(
    companyId,
    id
  ) {
    const businessService =
      await BusinessServiceRepository.deactivate(
        id,
        companyId
      );

    if (!businessService) {
      throw new Error(
        "Business service not found"
      );
    }

    return businessService;
  }

  async assignWorkflow(
    companyId,
    serviceId,
    workflowId
  ) {
    if (!workflowId) {
      throw new Error(
        "workflowId is required"
      );
    }

    const workflow =
      await WorkflowRepository.findById(
        workflowId,
        companyId
      );

    if (!workflow) {
      throw new Error(
        "Workflow not found"
      );
    }

    const businessService =
      await BusinessServiceRepository.assignWorkflow(
        serviceId,
        companyId,
        workflowId
      );

    if (!businessService) {
      throw new Error(
        "Business service not found"
      );
    }

    return businessService;
  }
}

export default new BusinessServiceService();