import WorkflowRepository from "./workflow.repository.js";
import WorkflowResolver from "./workflow.resolver.js";
import Memo from "../memo/memo.model.js";
import WorkflowInstance from "./workflowInstance.model.js";
import WorkflowStep from "./workflowStep.model.js";

class WorkflowEngine {
  async start(companyId, workflowId, resourceType, resourceId, userId = null) {
    const normalizedType = String(resourceType || "").toLowerCase();
    if (!normalizedType) throw new Error("Workflow resource type is required");
    if (!resourceId) throw new Error("Workflow resource ID is required");

    const workflow = await WorkflowRepository.findById(workflowId, companyId);
    if (!workflow) throw new Error("Workflow not found");
    if (!workflow.active || !workflow.isActive) throw new Error("Workflow is inactive");

    const existing = await WorkflowRepository.findInstanceByResource(companyId, normalizedType, resourceId);
    if (existing) throw new Error("A workflow instance already exists for this resource");

    const firstStep = await WorkflowRepository.findFirstStep(workflowId);
    if (!firstStep) throw new Error("Workflow has no active steps");

    let currentPosition = null;
    let currentEmployee = null;

    if (firstStep.position) {
      const resolved = await WorkflowResolver.resolvePosition(firstStep.position._id, companyId);
      currentPosition = resolved.position?._id || null;
      currentEmployee = resolved.employee?._id || null;
    } else if (firstStep.action === "submit") {
      currentEmployee = userId;
    }

    const instance = await WorkflowRepository.createInstance({
      company: companyId, workflow: workflowId, resourceType: normalizedType, resourceId,
      currentStep: firstStep._id, currentPosition, currentEmployee,
      status: "running", startedBy: userId, startedAt: new Date(),
    });

    await this.syncResource(companyId, normalizedType, resourceId, {
      workflow: workflowId, workflowInstance: instance._id, currentStep: firstStep.order,
      currentApprover: currentPosition, status: "Pending",
    });

    return WorkflowRepository.findInstance(instance._id, companyId);
  }

  async authorizeCurrentEmployee(instance, userId) {
    if (!userId) throw new Error("Authenticated user is required");
    if (!instance.currentEmployee) throw new Error("Current workflow step has no assigned employee");
    const currentId = instance.currentEmployee._id || instance.currentEmployee;
    if (String(currentId) !== String(userId)) throw new Error("You are not authorized to perform this workflow action");
  }

  async advance(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(instanceId, companyId);
    if (!instance) throw new Error("Workflow instance not found");
    if (instance.status !== "running") throw new Error(`Workflow cannot advance from status "${instance.status}"`);
    if (!instance.currentStep) throw new Error("Workflow instance has no current step");

    await this.authorizeCurrentEmployee(instance, userId);

    const currentOrder = instance.currentStep.order;
    let nextStep = await WorkflowRepository.findNextStep(instance.workflow._id, currentOrder);

    // Skip non-actionable terminal steps such as a final "Complete" node.
    if (nextStep && !nextStep.position && ["complete", "archive"].includes(nextStep.action)) {
      const completed = await WorkflowRepository.updateInstance(instanceId, companyId, {
        status: "completed", currentStep: null, currentPosition: null, currentEmployee: null,
        completedAt: new Date(), completedBy: userId,
      });
      await this.syncResource(companyId, instance.resourceType, instance.resourceId, {
        status: "Completed", currentStep: null, currentApprover: null, workflowInstance: instance._id,
      });
      return completed;
    }

    if (!nextStep) {
      const completed = await WorkflowRepository.updateInstance(instanceId, companyId, {
        status: "completed", currentStep: null, currentPosition: null, currentEmployee: null,
        completedAt: new Date(), completedBy: userId,
      });
      await this.syncResource(companyId, instance.resourceType, instance.resourceId, {
        status: "Completed", currentStep: null, currentApprover: null, workflowInstance: instance._id,
      });
      return completed;
    }

    let currentPosition = null;
    let currentEmployee = null;

    if (nextStep.position) {
      const resolved = await WorkflowResolver.resolvePosition(nextStep.position._id, companyId);
      currentPosition = resolved.position?._id || null;
      currentEmployee = resolved.employee?._id || null;
    }

    if (!currentEmployee && nextStep.action !== "submit") {
      throw new Error(`Workflow step "${nextStep.name}" has no active position occupant`);
    }

    const updated = await WorkflowRepository.updateInstance(instanceId, companyId, {
      currentStep: nextStep._id, currentPosition, currentEmployee, status: "running",
    });

    await this.syncResource(companyId, instance.resourceType, instance.resourceId, {
      status: "Pending", currentStep: nextStep.order, currentApprover: currentPosition, workflowInstance: instance._id,
    });

    return updated;
  }

  async reject(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(instanceId, companyId);
    if (!instance) throw new Error("Workflow instance not found");
    if (instance.status !== "running") throw new Error(`Workflow cannot be rejected from status "${instance.status}"`);
    await this.authorizeCurrentEmployee(instance, userId);

    const updated = await WorkflowRepository.updateInstance(instanceId, companyId, {
      status: "rejected", rejectedAt: new Date(), rejectedBy: userId,
      currentStep: null, currentPosition: null, currentEmployee: null,
    });

    await this.syncResource(companyId, instance.resourceType, instance.resourceId, {
      status: "Rejected", currentStep: null, currentApprover: null, workflowInstance: instance._id,
    });
    return updated;
  }

  async cancel(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(instanceId, companyId);
    if (!instance) throw new Error("Workflow instance not found");
    if (instance.status !== "running") throw new Error(`Workflow cannot be cancelled from status "${instance.status}"`);
    await this.authorizeCurrentEmployee(instance, userId);

    const updated = await WorkflowRepository.updateInstance(instanceId, companyId, {
      status: "cancelled", cancelledAt: new Date(), cancelledBy: userId,
      currentStep: null, currentPosition: null, currentEmployee: null,
    });

    await this.syncResource(companyId, instance.resourceType, instance.resourceId, {
      status: "Cancelled", currentStep: null, currentApprover: null, workflowInstance: instance._id,
    });
    return updated;
  }

  async resubmit({ instanceId, employeeId, companyId }) {
    const oldInstance = await WorkflowInstance.findOne({ _id: instanceId, company: companyId, isActive: true });
    if (!oldInstance) throw new Error("Workflow instance not found");
    if (oldInstance.status !== "rejected") throw new Error("Only rejected workflow instances can be resubmitted");

    const firstStep = await WorkflowStep.findOne({ workflow: oldInstance.workflow, order: 1, isActive: true }).populate("position");
    if (!firstStep) throw new Error("Workflow has no active starting step");

    let currentPosition = null;
    let currentEmployee = null;
    if (firstStep.position) {
      const resolved = await WorkflowResolver.resolvePosition(firstStep.position._id, companyId);
      currentPosition = resolved.position?._id || null;
      currentEmployee = resolved.employee?._id || null;
    } else if (firstStep.action === "submit") {
      currentEmployee = employeeId;
    }

    const newInstance = await WorkflowInstance.create({
      company: oldInstance.company, workflow: oldInstance.workflow, resourceType: oldInstance.resourceType, resourceId: oldInstance.resourceId,
      currentStep: firstStep._id, currentPosition, currentEmployee, status: "running", startedBy: employeeId, startedAt: new Date(),
    });

    await this.syncResource(companyId, oldInstance.resourceType, oldInstance.resourceId, {
      workflowInstance: newInstance._id, currentStep: firstStep.order, currentApprover: currentPosition, status: "Pending",
    });

    return WorkflowRepository.findInstance(newInstance._id, companyId);
  }

  async syncResource(companyId, resourceType, resourceId, data) {
    if (resourceType !== "memo") throw new Error(`Unsupported workflow resource type: ${resourceType}`);
    return Memo.findOneAndUpdate({ _id: resourceId, company: companyId, isActive: true, deletedAt: null }, data, { new: true, runValidators: true });
  }
}

export default new WorkflowEngine();
