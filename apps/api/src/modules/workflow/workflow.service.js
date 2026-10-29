import WorkflowRepository from "./workflow.repository.js";
import WorkflowResolver from "./workflow.resolver.js";
import WorkflowEngine from "./workflow.engine.js";
import BusinessService from "../business-service/businessService.model.js";
import Position from "../position/position.model.js";
import WorkflowStep from "./workflowStep.model.js";
import {
  validateCreateWorkflow,
  validateCreateWorkflowStep,
} from "./workflow.validator.js";

async function validateBusinessService(companyId, businessServiceId) {
  if (!businessServiceId) return;

  const service = await BusinessService.findOne({
    _id: businessServiceId,
    company: companyId,
    isActive: true,
    active: true,
    deletedAt: null,
  }).select("_id").lean();

  if (!service) {
    throw new Error("Business service not found in this company");
  }
}

async function validateWorkflowPosition(companyId, positionId) {
  if (!positionId) {
    throw new Error("Workflow position is required");
  }

  const position = await Position.findOne({
    _id: positionId,
    company: companyId,
    isActive: true,
    active: true,
    isWorkflowNode: true,
    deletedAt: null,
  }).select("_id").lean();

  if (!position) {
    throw new Error("Workflow position not found in this company");
  }
}

function safeWorkflowUpdates(payload = {}) {
  const updates = { ...payload };
  // Tenant ownership and lifecycle fields are server-controlled.
  for (const field of ["_id", "company", "createdBy", "isActive", "deletedAt"]) {
    delete updates[field];
  }
  return updates;
}

function safeStepUpdates(payload = {}) {
  const updates = { ...payload };
  // A step must remain attached to the workflow selected by the route.
  for (const field of ["_id", "workflow", "isActive", "deletedAt", "createdBy"]) {
    delete updates[field];
  }
  return updates;
}

class WorkflowService {
  async createWorkflow(companyId, payload) {
    validateCreateWorkflow(payload);
    await validateBusinessService(companyId, payload.businessService);

    const workflow = await WorkflowRepository.create({
      ...payload,
      company: companyId,
    });

    if (payload.businessService) {
      await BusinessService.findOneAndUpdate(
        {
          _id: payload.businessService,
          company: companyId,
          isActive: true,
          active: true,
        },
        { workflow: workflow._id }
      );
    }

    return workflow;
  }

  async listWorkflows(companyId) {
    return WorkflowRepository.findAll(companyId);
  }

  async getWorkflow(companyId, id) {
    const workflow = await WorkflowRepository.findById(id, companyId);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const steps = await WorkflowRepository.findSteps(workflow._id);

    return { workflow, steps };
  }

  async updateWorkflow(companyId, id, payload) {
    const existing = await WorkflowRepository.findById(id, companyId);

    if (!existing) {
      throw new Error("Workflow not found");
    }

    const updates = safeWorkflowUpdates(payload);
    if (updates.businessService !== undefined) {
      await validateBusinessService(companyId, updates.businessService);
    }

    const workflow = await WorkflowRepository.update(
      id,
      companyId,
      updates
    );

    if (updates.businessService !== undefined) {
      await BusinessService.updateMany(
        {
          company: companyId,
          workflow: id,
        },
        { workflow: null }
      );

      if (updates.businessService) {
        await BusinessService.findOneAndUpdate(
          {
            _id: updates.businessService,
            company: companyId,
            isActive: true,
            active: true,
          },
          { workflow: id }
        );
      }
    }

    return workflow;
  }

  async deleteWorkflow(companyId, id) {
    const workflow = await WorkflowRepository.deactivate(
      id,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await BusinessService.updateMany(
      {
        company: companyId,
        workflow: id,
      },
      { workflow: null }
    );

    return workflow;
  }

  async addStep(companyId, workflowId, payload) {
    const workflow = await WorkflowRepository.findById(
      workflowId,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const steps = await WorkflowRepository.findSteps(workflowId);

    const order =
      Number(payload.order) > 0
        ? Number(payload.order)
        : steps.length + 1;

    validateCreateWorkflowStep({
      ...payload,
      order,
    });
    await validateWorkflowPosition(companyId, payload.position);

    if (steps.some((step) => Number(step.order) === order)) {
      await WorkflowRepository.shiftStepsFromOrder(
        workflowId,
        order
      );
    }

    return WorkflowRepository.createStep({
      ...payload,
      order,
      workflow: workflowId,
    });
  }

  async updateStep(companyId, workflowId, stepId, payload) {
    const workflow = await WorkflowRepository.findById(
      workflowId,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const existingSteps = await WorkflowRepository.findSteps(
      workflowId
    );

    const existing = existingSteps.find(
      (step) => String(step._id) === String(stepId)
    );

    if (!existing) {
      throw new Error("Workflow step not found");
    }

    validateCreateWorkflowStep({
      ...existing.toObject?.(),
      ...payload,
      order:
        payload.order !== undefined
          ? Number(payload.order)
          : existing.order,
    });
    await validateWorkflowPosition(
      companyId,
      payload.position !== undefined ? payload.position : existing.position
    );

    if (
      payload.order !== undefined &&
      Number(payload.order) !== Number(existing.order)
    ) {
      await WorkflowRepository.shiftStepsFromOrder(
        workflowId,
        Number(payload.order)
      );
    }

    const step = await WorkflowRepository.updateStep(
      workflowId,
      stepId,
      safeStepUpdates(payload)
    );

    if (!step) {
      throw new Error("Workflow step not found");
    }

    return step;
  }

  async reactivateStep(companyId, workflowId, stepId, payload) {
    const workflow = await WorkflowRepository.findById(
      workflowId,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const existing = await WorkflowStep.findOne({
      _id: stepId,
      workflow: workflowId,
      isActive: false,
    });
    if (!existing) {
      throw new Error("Workflow step not found");
    }

    const positionId = payload.position !== undefined ? payload.position : existing.position;
    await validateWorkflowPosition(companyId, positionId);

    const step = await WorkflowRepository.reactivateStep(
      workflowId,
      stepId,
      safeStepUpdates(payload)
    );

    if (!step) {
      throw new Error("Workflow step not found");
    }

    return step;
  }

  async deleteStep(companyId, workflowId, stepId) {
    const workflow = await WorkflowRepository.findById(
      workflowId,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const step = await WorkflowRepository.deactivateStep(
      workflowId,
      stepId
    );

    if (!step) {
      throw new Error("Workflow step not found");
    }

    return step;
  }

  async resolvePosition(positionId, companyId) {
    return WorkflowResolver.resolvePosition(
      positionId,
      companyId
    );
  }

  async getWorkflowInstance(companyId, instanceId) {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    return instance;
  }

  async resolveCurrentStep(companyId, instanceId) {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (!instance.currentStep) {
      return {
        instance,
        step: null,
        position: null,
        employee: null,
      };
    }

    const step = instance.currentStep;

    if (!step.position) {
      return {
        instance,
        step,
        position: null,
        employee: null,
      };
    }

    const resolved = await WorkflowResolver.resolvePosition(
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

  async resubmitInstance(companyId, instanceId, employeeId, comment = "") {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (instance.status !== "rejected") {
      throw new Error(
        "Only rejected workflow instances can be resubmitted"
      );
    }

    return WorkflowEngine.resubmit({
      instanceId,
      employeeId,
      comment,
    });
  }
}

export default new WorkflowService();
