import WorkflowRepository from "./workflow.repository.js";

class WorkflowService {
  async createWorkflow(companyId, payload) {
    if (!payload.name) {
      throw new Error("Workflow name is required");
    }

    if (!payload.code) {
      throw new Error("Workflow code is required");
    }

    return WorkflowRepository.create({
      ...payload,
      company: companyId,
    });
  }

  async listWorkflows(companyId) {
    return WorkflowRepository.findAll(companyId);
  }

  async getWorkflow(companyId, id) {
    const workflow =
      await WorkflowRepository.findById(id, companyId);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const steps =
      await WorkflowRepository.findSteps(workflow._id);

    return {
      workflow,
      steps,
    };
  }

  async updateWorkflow(companyId, id, payload) {
    return WorkflowRepository.update(
      id,
      companyId,
      payload
    );
  }

  async deleteWorkflow(companyId, id) {
    return WorkflowRepository.deactivate(
      id,
      companyId
    );
  }

  async addStep(companyId, workflowId, payload) {
    const workflow =
      await WorkflowRepository.findById(
        workflowId,
        companyId
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!payload.name) {
      throw new Error("Step name is required");
    }

    if (!payload.action) {
      throw new Error("Step action is required");
    }

    return WorkflowRepository.createStep({
      ...payload,
      workflow: workflowId,
    });
  }
}

export default new WorkflowService();