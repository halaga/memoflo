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
    const allowed = ["name", "code", "description", "businessService", "active"];
    return Object.fromEntries(allowed.filter((field) => Object.prototype.hasOwnProperty.call(payload, field)).map((field) => [field, payload[field]]));
}
function safeStepUpdates(payload = {}) {
    const allowed = ["name", "action", "position", "assignmentRule", "required", "allowDelegate"];
    return Object.fromEntries(allowed.filter((field) => Object.prototype.hasOwnProperty.call(payload, field)).map((field) => [field, payload[field]]));
}
class WorkflowService {
    async assertNoRunningInstances(companyId, workflowId, operation = "change workflow stages") {
        const running = await WorkflowInstance.exists({
            company: companyId,
            workflow: workflowId,
            status: { $in: ["pending", "running"] },
            isActive: true,
            deletedAt: null,
        });
        if (running) {
            throw new Error(`This workflow has requests in progress. Complete or cancel those requests before you ${operation}; active requests must keep the stage sequence they started with.`);
        }
    }

    async bumpVersion(companyId, workflowId) {
        await WorkflowRepository.update(workflowId, companyId, { $inc: { version: 1 } });
    }

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
        if (updates.active === false && existing.active !== false) {
            await this.assertNoRunningInstances(companyId, id, "deactivate this workflow");
        }
        if (updates.active === true && existing.active === false) {
            const configuredSteps = await WorkflowRepository.findSteps(companyId, id);
            if (!configuredSteps.length) throw new Error("Add at least one workflow stage before activating this workflow.");
            for (const step of configuredSteps) {
                await validateWorkflowPosition(companyId, step.position?._id || step.position);
            }
        }
        if (updates.businessService !== undefined) {
            await validateBusinessService(companyId, updates.businessService);
        }
        if (updates.active === false) {
            const assignedServices = await BusinessService.find({ company: companyId, active: true, isActive: true })
                .select("name workflow requisitionWorkflowMap").lean();
            const assigned = assignedServices.find((service) => String(service.workflow || "") === String(id)
                || Object.values(service.requisitionWorkflowMap || {}).some((workflowId) => String(workflowId) === String(id)));
            if (assigned) throw new Error(`Reassign ${assigned.name} to another workflow before deactivating this workflow.`);
        }
        const workflow = await WorkflowRepository.update(id, companyId, { ...updates, $inc: { version: 1 } });
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
        await this.assertNoRunningInstances(companyId, workflowId, "add a stage");
        const steps = await WorkflowStep.find({ company: companyId, workflow: workflowId }).select("order").lean();
        const order = steps.reduce((max, step) => Math.max(max, Number(step.order) || 0), 0) + 1;
        validateCreateWorkflowStep({ ...payload, order });
        await validateWorkflowPosition(companyId, payload.position);
        const created = await WorkflowRepository.createStep({
            ...payload,
            company: companyId,
            order,
            workflow: workflowId,
        });
        await this.bumpVersion(companyId, workflowId);
        return created;
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
        await this.assertNoRunningInstances(companyId, workflowId, "edit a stage");
        validateCreateWorkflowStep({
            ...existing.toObject?.(),
            ...payload,
            order: payload.order !== undefined
                ? Number(payload.order)
                : existing.order,
        });
await validateWorkflowPosition(companyId, payload.position !== undefined ? payload.position : existing.position);
        const stepUpdates = safeStepUpdates(payload);
        delete stepUpdates.order; // Stage order is changed only through the reorder operation.
        const step = await WorkflowRepository.updateStep(companyId, workflowId, stepId, stepUpdates);
        if (!step) {
            throw new Error("Workflow step not found");
        }
        await this.bumpVersion(companyId, workflowId);
        return step;
    }
    async reorderStep(companyId, workflowId, stepId, targetOrder) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) throw new Error("Workflow not found");
        await this.assertNoRunningInstances(companyId, workflowId, "reorder stages");
        const order = Number(targetOrder);
        if (!Number.isInteger(order) || order < 1) throw new Error("Target stage order must be a positive integer.");
        const steps = await WorkflowRepository.findSteps(companyId, workflowId);
        const fromIndex = steps.findIndex((step) => String(step._id) === String(stepId));
        if (fromIndex < 0) throw new Error("Workflow step not found");
        const toIndex = Math.min(order - 1, steps.length - 1);
        const [moving] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, moving);
        await WorkflowRepository.reorderSteps(companyId, workflowId, steps.map((step) => step._id));
        await this.bumpVersion(companyId, workflowId);
        return WorkflowRepository.findSteps(companyId, workflowId);
    }
    async reactivateStep(companyId, workflowId, stepId, payload) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        await this.assertNoRunningInstances(companyId, workflowId, "reactivate a stage");
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
        await this.bumpVersion(companyId, workflowId);
        return step;
    }
    async deleteStep(companyId, workflowId, stepId) {
        const workflow = await WorkflowRepository.findById(workflowId, companyId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        await this.assertNoRunningInstances(companyId, workflowId, "remove a stage");
        const step = await WorkflowRepository.deactivateStep(companyId, workflowId, stepId);
        if (!step) {
            throw new Error("Workflow step not found");
        }
        await this.bumpVersion(companyId, workflowId);
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
