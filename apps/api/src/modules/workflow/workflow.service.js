import WorkflowRepository from "./workflow.repository.js";
import WorkflowResolver from "./workflow.resolver.js";
import WorkflowEngine from "./workflow.engine.js";
import BusinessService from "../business-service/businessService.model.js";
import Position from "../position/position.model.js";
import WorkflowStep from "./workflowStep.model.js";
import WorkflowInstance from "./workflowInstance.model.js";
import { validateCreateWorkflow, validateCreateWorkflowStep, } from "./workflow.validator.js";
async function validateBusinessService(companyId, businessServiceId) {
    if (!businessServiceId)
        return;
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
            await BusinessService.findOneAndUpdate({
                _id: payload.businessService,
                company: companyId,
                isActive: true,
                active: true,
            }, { workflow: workflow._id });
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
        const steps = await WorkflowRepository.findSteps(companyId, workflow._id);
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
        const workflow = await WorkflowRepository.update(id, companyId, updates);
        if (updates.businessService !== undefined) {
            await BusinessService.updateMany({
                company: companyId,
                workflow: id,
            }, { workflow: null });
            if (updates.businessService) {
                await BusinessService.findOneAndUpdate({
                    _id: updates.businessService,
                    company: companyId,
                    isActive: true,
                    active: true,
                }, { workflow: id });
            }
        }
        return workflow;
    }
    async deleteWorkflow(companyId, id) {
        const workflow = await WorkflowRepository.findById(id, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const instances = await WorkflowInstance.countDocuments({
            company: companyId,
            workflow: id,
            isActive: true,
            deletedAt: null,
        });
        if (instances > 0) {
            throw new Error("This workflow has existing workflow history. Reassign its services and keep it active so historical records remain readable.");
        }
        const services = await BusinessService.find({ company: companyId, isActive: true, active: true })
            .select("_id name workflow requisitionWorkflowMap").lean();
        const assignedService = services.find((service) => {
            if (String(service.workflow || "") === String(id)) return true;
            return Object.values(service.requisitionWorkflowMap || {}).some((workflowId) => String(workflowId) === String(id));
        });
        if (assignedService) {
            throw new Error(`Reassign ${assignedService.name} to another workflow before deactivating this workflow.`);
        }
        return WorkflowRepository.deactivate(id, companyId);
    }
    async addStep(companyId, workflowId, payload) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const steps = await WorkflowRepository.findSteps(companyId, workflowId);
        const order = Number(payload.order) > 0
            ? Number(payload.order)
            : steps.length + 1;
        validateCreateWorkflowStep({
            ...payload,
            order,
        });
        await validateWorkflowPosition(companyId, payload.position);
        if (steps.some((step) => Number(step.order) === order)) {
            await WorkflowRepository.shiftStepsFromOrder(companyId, workflowId, order);
        }
        return WorkflowRepository.createStep({
            ...payload,
            company: companyId,
            order,
            workflow: workflowId,
        });
    }
    async updateStep(companyId, workflowId, stepId, payload) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const existingSteps = await WorkflowRepository.findSteps(companyId, workflowId);
        const existing = existingSteps.find((step) => String(step._id) === String(stepId));
        if (!existing) {
            throw new Error("Workflow step not found");
        }
        const inFlight = await WorkflowInstance.exists({
            company: companyId,
            workflow: workflowId,
            currentStep: stepId,
            status: "running",
            isActive: true,
        });
        if (inFlight) {
            throw new Error("This step is currently in use by an active workflow. Finish or reassign the running request before editing it.");
        }
        validateCreateWorkflowStep({
            ...existing.toObject?.(),
            ...payload,
            order: payload.order !== undefined
                ? Number(payload.order)
                : existing.order,
        });
await validateWorkflowPosition(companyId, payload.position !== undefined ? payload.position : existing.position);
        if (payload.order !== undefined &&
            Number(payload.order) !== Number(existing.order)) {
            await WorkflowRepository.shiftStepsFromOrder(companyId, workflowId, Number(payload.order));
        }
        const step = await WorkflowRepository.updateStep(companyId, workflowId, stepId, safeStepUpdates(payload));
        if (!step) {
            throw new Error("Workflow step not found");
        }
        return step;
    }
    async reactivateStep(companyId, workflowId, stepId, payload) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const existing = await WorkflowStep.findOne({
            _id: stepId,
            company: companyId,
            workflow: workflowId,
            isActive: false,
        });
        if (!existing) {
            throw new Error("Workflow step not found");
        }
        const positionId = payload.position !== undefined ? payload.position : existing.position;
        await validateWorkflowPosition(companyId, positionId);
        const step = await WorkflowRepository.reactivateStep(companyId, workflowId, stepId, safeStepUpdates(payload));
        if (!step) {
            throw new Error("Workflow step not found");
        }
        return step;
    }
    async deleteStep(companyId, workflowId, stepId) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const inFlight = await WorkflowInstance.exists({
            company: companyId,
            workflow: workflowId,
            currentStep: stepId,
            status: "running",
            isActive: true,
        });
        if (inFlight) {
            throw new Error("This step is currently assigned to an active request and cannot be removed yet.");
        }
        const step = await WorkflowRepository.deactivateStep(companyId, workflowId, stepId);
        if (!step) {
            throw new Error("Workflow step not found");
        }
        return step;
    }
    async resolvePosition(positionId, companyId) {
        return WorkflowResolver.resolvePosition(positionId, companyId);
    }
    async getWorkflowInstance(companyId, instanceId) {
        const instance = await WorkflowRepository.findInstance(instanceId, companyId);
        if (!instance) {
            throw new Error("Workflow instance not found");
        }
        return instance;
    }
    async resolveCurrentStep(companyId, instanceId) {
        const instance = await WorkflowRepository.findInstance(instanceId, companyId);
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
        return {
            instance,
            step,
            position: instance.currentPosition || null,
            employee: instance.currentEmployee || null,
        };
    }
    async resubmitInstance(companyId, instanceId, employeeId, comment = "") {
        const instance = await WorkflowRepository.findInstance(instanceId, companyId);
        if (!instance) {
            throw new Error("Workflow instance not found");
        }
        if (instance.status !== "rejected") {
            throw new Error("Only rejected workflow instances can be resubmitted");
        }
        return WorkflowEngine.resubmit({
            companyId,
            instanceId,
            employeeId,
            comment,
        });
    }
}
export default new WorkflowService();
