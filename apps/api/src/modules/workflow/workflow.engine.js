import WorkflowRepository from "./workflow.repository.js";
import WorkflowResolver from "./workflow.resolver.js";
import Memo from "../memo/memo.model.js";
import WorkflowInstance from "./workflowInstance.model.js";
import WorkflowStep from "./workflowStep.model.js";
import NotificationService from "../notification/notification.service.js";

class WorkflowEngine {
  async notify({
    company,
    recipient,
    title,
    message,
    link = "",
    type = "workflow",
    createdBy = null,
  }) {
    if (!recipient) return;

    try {
      await NotificationService.create({
        company,
        recipient,
        title,
        message,
        link,
        type,
        createdBy,
      });
    } catch (error) {
      // Notification failure must never break the workflow transaction.
      console.error("Notification error:", error.message);
    }
  }

  async notifyMemoOwner(companyId, memoId, title, message, link) {
    const memo = await Memo.findOne({
      _id: memoId,
      company: companyId,
      isActive: true,
    }).select("createdBy");

    if (memo?.createdBy) {
      await this.notify({
        company: companyId,
        recipient: memo.createdBy,
        title,
        message,
        link,
      });
    }
  }

  async start(
    companyId,
    workflowId,
    resourceType,
    resourceId,
    userId = null
  ) {
    if (!resourceType) {
      throw new Error("Workflow resource type is required");
    }

    if (!resourceId) {
      throw new Error("Workflow resource ID is required");
    }

    const normalizedResourceType = String(resourceType).toLowerCase();

    const workflow = await WorkflowRepository.findById(
      workflowId,
      companyId
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.active || !workflow.isActive) {
      throw new Error("Workflow is inactive");
    }

    const existingInstance =
      await WorkflowRepository.findInstanceByResource(
        companyId,
        normalizedResourceType,
        resourceId
      );

    if (existingInstance) {
      throw new Error(
        "A workflow instance already exists for this resource"
      );
    }

    const firstStep = await WorkflowRepository.findFirstStep(
      workflowId
    );

    if (!firstStep) {
      throw new Error("Workflow has no active steps");
    }

    const resolved = firstStep.position
      ? await WorkflowResolver.resolvePosition(
          firstStep.position._id,
          companyId
        )
      : null;

    const currentPosition = resolved?.position?._id || null;
    const currentEmployee = resolved?.employee?._id || null;

    const instance = await WorkflowRepository.createInstance({
      company: companyId,
      workflow: workflowId,
      resourceType: normalizedResourceType,
      resourceId,
      currentStep: firstStep._id,
      currentPosition,
      currentEmployee,
      status: "running",
      startedBy: userId,
      startedAt: new Date(),
    });

    await this.syncResource(
      companyId,
      normalizedResourceType,
      resourceId,
      {
        workflow: workflowId,
        workflowInstance: instance._id,
        currentStep: firstStep.order,
        currentApprover: currentEmployee,
        status: "Pending",
      }
    );

    if (currentEmployee) {
      await this.notify({
        company: companyId,
        recipient: currentEmployee,
        title: "Workflow action required",
        message: `${workflow.name} is waiting for your ${firstStep.action} action.`,
        link:
          normalizedResourceType === "memo"
            ? `/memos/${resourceId}`
            : "",
        createdBy: userId,
      });
    }

    return WorkflowRepository.findInstance(
      instance._id,
      companyId
    );
  }

  async authorizeCurrentEmployee(instance, userId) {
    if (!userId) {
      throw new Error("Authenticated user is required");
    }

    if (!instance.currentEmployee) {
      throw new Error(
        "Current workflow step has no assigned employee"
      );
    }

    const currentEmployeeId =
      instance.currentEmployee._id ||
      instance.currentEmployee;

    if (String(currentEmployeeId) !== String(userId)) {
      throw new Error(
        "You are not authorized to perform this workflow action"
      );
    }
  }

  async advance(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (instance.status !== "running") {
      throw new Error(
        `Workflow cannot advance from status "${instance.status}"`
      );
    }

    if (!instance.currentStep) {
      throw new Error("Workflow instance has no current step");
    }

    await this.authorizeCurrentEmployee(instance, userId);

    const currentStep = instance.currentStep;
    const currentOrder = currentStep.order;

    const nextStep = await WorkflowRepository.findNextStep(
      instance.workflow._id,
      currentOrder
    );

    if (!nextStep) {
      const completedInstance =
        await WorkflowRepository.updateInstance(
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

      const finalStatus =
        currentStep.action === "pay" ? "Completed" : "Approved";

      await this.syncResource(
        companyId,
        instance.resourceType,
        instance.resourceId,
        {
          status: finalStatus,
          currentStep: null,
          currentApprover: null,
          workflowInstance: instance._id,
        }
      );

      if (instance.resourceType === "memo") {
        await this.notifyMemoOwner(
          companyId,
          instance.resourceId,
          "Memo workflow completed",
          "Your memo approval workflow has been completed.",
          `/memos/${instance.resourceId}`
        );
      }

      return completedInstance;
    }

    const resolved = nextStep.position
      ? await WorkflowResolver.resolvePosition(
          nextStep.position._id,
          companyId
        )
      : null;

    const currentPosition = resolved?.position?._id || null;
    const currentEmployee = resolved?.employee?._id || null;

    const updatedInstance =
      await WorkflowRepository.updateInstance(
        instanceId,
        companyId,
        {
          currentStep: nextStep._id,
          currentPosition,
          currentEmployee,
          status: "running",
        }
      );

    await this.syncResource(
      companyId,
      instance.resourceType,
      instance.resourceId,
      {
        status: "Pending",
        currentStep: nextStep.order,
        currentApprover: currentEmployee,
        workflowInstance: instance._id,
      }
    );

    if (currentEmployee) {
      await this.notify({
        company: companyId,
        recipient: currentEmployee,
        title: "Workflow action required",
        message: `${instance.workflow.name} is waiting for your ${nextStep.action} action.`,
        link:
          instance.resourceType === "memo"
            ? `/memos/${instance.resourceId}`
            : "",
        createdBy: userId,
      });
    }

    return updatedInstance;
  }

  async reject(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (instance.status !== "running") {
      throw new Error(
        `Workflow cannot be rejected from status "${instance.status}"`
      );
    }

    await this.authorizeCurrentEmployee(instance, userId);

    const updatedInstance =
      await WorkflowRepository.updateInstance(
        instanceId,
        companyId,
        {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: userId,
          currentStep: null,
          currentPosition: null,
          currentEmployee: null,
        }
      );

    await this.syncResource(
      companyId,
      instance.resourceType,
      instance.resourceId,
      {
        status: "Rejected",
        currentStep: null,
        currentApprover: null,
        workflowInstance: instance._id,
      }
    );

    if (instance.resourceType === "memo") {
      await this.notifyMemoOwner(
        companyId,
        instance.resourceId,
        "Memo rejected",
        "Your memo has been rejected in the approval workflow.",
        `/memos/${instance.resourceId}`
      );
    }

    return updatedInstance;
  }

  async cancel(companyId, instanceId, userId = null) {
    const instance = await WorkflowRepository.findInstance(
      instanceId,
      companyId
    );

    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (instance.status !== "running") {
      throw new Error(
        `Workflow cannot be cancelled from status "${instance.status}"`
      );
    }

    await this.authorizeCurrentEmployee(instance, userId);

    const updatedInstance =
      await WorkflowRepository.updateInstance(
        instanceId,
        companyId,
        {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: userId,
          currentStep: null,
          currentPosition: null,
          currentEmployee: null,
        }
      );

    await this.syncResource(
      companyId,
      instance.resourceType,
      instance.resourceId,
      {
        status: "Cancelled",
        currentStep: null,
        currentApprover: null,
        workflowInstance: instance._id,
      }
    );

    if (instance.resourceType === "memo") {
      await this.notifyMemoOwner(
        companyId,
        instance.resourceId,
        "Workflow cancelled",
        "The workflow for your memo has been cancelled.",
        `/memos/${instance.resourceId}`
      );
    }

    return updatedInstance;
  }

  async resubmit({ instanceId, employeeId }) {
    const oldInstance = await WorkflowInstance.findById(instanceId);

    if (!oldInstance) {
      throw new Error("Workflow instance not found");
    }

    if (oldInstance.status !== "rejected") {
      throw new Error(
        "Only rejected workflow instances can be resubmitted"
      );
    }

    if (oldInstance.resourceType !== "memo") {
      throw new Error(
        "Only memo workflows can currently be resubmitted"
      );
    }

    const firstStep = await WorkflowStep.findOne({
      workflow: oldInstance.workflow,
      order: 1,
      isActive: true,
    }).populate("position");

    if (!firstStep) {
      throw new Error("Workflow has no active starting step");
    }

    let currentPosition = null;
    let currentEmployee = null;

    if (firstStep.position) {
      const resolved = await WorkflowResolver.resolvePosition(
        firstStep.position._id,
        oldInstance.company
      );

      currentPosition = resolved.position;
      currentEmployee = resolved.employee;
    }

    const newInstance = await WorkflowInstance.create({
      company: oldInstance.company,
      workflow: oldInstance.workflow,
      resourceType: oldInstance.resourceType,
      resourceId: oldInstance.resourceId,
      currentStep: firstStep._id,
      currentPosition: currentPosition?._id || null,
      currentEmployee: currentEmployee?._id || null,
      status: "running",
      startedBy: employeeId,
      startedAt: new Date(),
    });

    await this.syncResource(
      oldInstance.company,
      "memo",
      oldInstance.resourceId,
      {
        workflow: oldInstance.workflow,
        workflowInstance: newInstance._id,
        currentStep: firstStep.order,
        currentApprover: currentEmployee?._id || null,
        status: "Pending",
      }
    );

    if (currentEmployee) {
      await this.notify({
        company: oldInstance.company,
        recipient: currentEmployee._id,
        title: "Workflow resubmitted",
        message: "A rejected memo workflow has been resubmitted and requires action.",
        link: `/memos/${oldInstance.resourceId}`,
        createdBy: employeeId,
      });
    }

    return WorkflowRepository.findInstance(
      newInstance._id,
      oldInstance.company
    );
  }

  async syncResource(companyId, resourceType, resourceId, data) {
    if (resourceType === "memo") {
      return Memo.findOneAndUpdate(
        {
          _id: resourceId,
          company: companyId,
          isActive: true,
        },
        data,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    throw new Error(
      `Unsupported workflow resource type: ${resourceType}`
    );
  }
}

export default new WorkflowEngine();
