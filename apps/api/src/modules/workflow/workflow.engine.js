import WorkflowRepository from "./workflow.repository.js";
import WorkflowResolver from "./workflow.resolver.js";

class WorkflowEngine {
  async start(
    companyId,
    workflowId,
    resourceType,
    resourceId,
    userId = null
  ) {
    if (!resourceType) {
      throw new Error(
        "Workflow resource type is required"
      );
    }

    if (!resourceId) {
      throw new Error(
        "Workflow resource ID is required"
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

    const existingInstance =
      await WorkflowRepository.findInstanceByResource(
        companyId,
        resourceType,
        resourceId
      );

    if (existingInstance) {
      throw new Error(
        "A workflow instance already exists for this resource"
      );
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

    let currentPosition = null;
    let currentEmployee = null;

    if (firstStep.position) {
      const resolved =
        await WorkflowResolver.resolvePosition(
          firstStep.position._id,
          companyId
        );

      currentPosition =
        resolved.position._id;

      currentEmployee =
        resolved.employee._id;
    }

    return WorkflowRepository.createInstance({
      company: companyId,
      workflow: workflowId,

      resourceType,
      resourceId,

      currentStep: firstStep._id,
      currentPosition,
      currentEmployee,

      status: "running",

      startedBy: userId,
      startedAt: new Date(),
    });
  }

  async advance(
    companyId,
    instanceId,
    userId = null
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
      instance.status !== "running"
    ) {
      throw new Error(
        `Workflow cannot advance from status "${instance.status}"`
      );
    }

    if (!instance.currentStep) {
      throw new Error(
        "Workflow instance has no current step"
      );
    }

    const currentOrder =
      instance.currentStep.order;

    const nextStep =
      await WorkflowRepository.findNextStep(
        instance.workflow._id,
        currentOrder
      );

    if (!nextStep) {
      return WorkflowRepository.updateInstance(
        instanceId,
        companyId,
        {
          status: "completed",
          currentStep: null,
          currentPosition: null,
          currentEmployee: null,
          completedAt: new Date(),
          completedBy: userId,
        }
      );
    }

    let currentPosition = null;
    let currentEmployee = null;

    if (nextStep.position) {
      const resolved =
        await WorkflowResolver.resolvePosition(
          nextStep.position._id,
          companyId
        );

      currentPosition =
        resolved.position._id;

      currentEmployee =
        resolved.employee._id;
    }

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        currentStep: nextStep._id,
        currentPosition,
        currentEmployee,
        status: "running",
      }
    );
  }

  async reject(
    companyId,
    instanceId,
    userId = null
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
      instance.status !== "running"
    ) {
      throw new Error(
        `Workflow cannot be rejected from status "${instance.status}"`
      );
    }

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: userId,
      }
    );
  }

  async cancel(
    companyId,
    instanceId,
    userId = null
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
      instance.status !== "running"
    ) {
      throw new Error(
        `Workflow cannot be cancelled from status "${instance.status}"`
      );
    }

    return WorkflowRepository.updateInstance(
      instanceId,
      companyId,
      {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: userId,
      }
    );
  }
}

export default new WorkflowEngine();