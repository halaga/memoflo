import WorkflowRepository from "./workflow.repository.js";
import workflowResolver from "./workflow.resolver.js";

class WorkflowEngine {
  async start(
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

  async advance(
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

    if (
      !instance.currentStep ||
      !instance.currentStep.order
    ) {
      throw new Error(
        "Workflow instance has no current step"
      );
    }

    const nextStep =
      await WorkflowRepository.findNextStep(
        instance.workflow._id,
        instance.currentStep.order
      );

    if (!nextStep) {
      return WorkflowRepository.updateInstance(
        instanceId,
        companyId,
        {
          status: "completed",
          currentStep: null,
          completedAt: new Date(),
        }
      );
    }

    if (nextStep.position) {
      await workflowResolver.resolvePosition(
        nextStep.position._id,
        companyId
      );
    }

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        currentStep: nextStep._id,
        status: "running",
      }
    );
  }

  async reject(
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

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        status: "rejected",
      }
    );
  }

  async cancel(
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

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        status: "cancelled",
      }
    );
  }
}

export default new WorkflowEngine();