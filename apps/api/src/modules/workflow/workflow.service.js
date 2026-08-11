import WorkflowRepository from "./workflow.repository.js";
import workflowResolver from "./workflow.resolver.js";
import {
  validateCreateWorkflow,
  validateCreateWorkflowStep,
} from "./workflow.validator.js";

class WorkflowService {
  async createWorkflow(companyId, payload) {
    validateCreateWorkflow(payload);

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
      await WorkflowRepository.findById(
        id,
        companyId
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const steps =
      await WorkflowRepository.findSteps(
        workflow._id
      );

    return {
      workflow,
      steps,
    };
  }

  async updateWorkflow(
    companyId,
    id,
    payload
  ) {
    const workflow =
      await WorkflowRepository.update(
        id,
        companyId,
        payload
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    return workflow;
  }

  async deleteWorkflow(companyId, id) {
    const workflow =
      await WorkflowRepository.deactivate(
        id,
        companyId
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    return workflow;
  }

  async addStep(
    companyId,
    workflowId,
    payload
  ) {
    const workflow =
      await WorkflowRepository.findById(
        workflowId,
        companyId
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    validateCreateWorkflowStep(payload);

    return WorkflowRepository.createStep({
      ...payload,
      workflow: workflowId,
    });
  }

  async resolvePosition(
    positionId,
    companyId
  ) {
    return workflowResolver.resolvePosition(
      positionId,
      companyId
    );
  }

  async startWorkflow(
    companyId,
    workflowId,
    resourceType,
    resourceId
  ) {
    const workflow =
      await WorkflowRepository.findById(
        workflowId,
        companyId
      );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const firstStep =
      await WorkflowRepository.findFirstStep(
        workflowId
      );

    if (!firstStep) {
      throw new Error(
        "Workflow has no active steps"
      );
    }

    if (firstStep.position) {
      await workflowResolver.resolvePosition(
        firstStep.position._id,
        companyId
      );
    }

    return WorkflowRepository.createInstance({
      company: companyId,
      workflow: workflowId,
      resourceType,
      resourceId,
      currentStep: firstStep._id,
      status: "running",
      startedAt: new Date(),
    });
  }

  async getWorkflowInstance(
    companyId,
    instanceId
  ) {
    const instance =
      await WorkflowRepository.findInstance(
        instanceId,
        companyId
      );

    if (!instance) {
      throw new Error(
        "Workflow instance not found"
      );
    }

    return instance;
  }

  async resolveCurrentStep(
    companyId,
    instanceId
  ) {
    const instance =
      await WorkflowRepository.findInstance(
        instanceId,
        companyId
      );

    if (!instance) {
      throw new Error(
        "Workflow instance not found"
      );
    }

    if (!instance.currentStep) {
      throw new Error(
        "Workflow instance has no current step"
      );
    }

    const step = instance.currentStep;

    if (!step.position) {
      return {
        instance,
        step,
        employee: null,
        position: null,
      };
    }

    const resolved =
      await workflowResolver.resolvePosition(
        step.position._id,
        companyId
      );

    return {
      instance,
      step,
      position: resolved.position,
      employee: resolved.employee,
    };
  }
}

export default new WorkflowService();