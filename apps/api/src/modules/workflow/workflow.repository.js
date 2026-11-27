import Workflow from "./workflow.model.js";
import WorkflowStep from "./workflowStep.model.js";
import WorkflowInstance from "./workflowInstance.model.js";
class WorkflowRepository {
    // ==========================================
    // WORKFLOWS
    // ==========================================
    async create(data) {
        return Workflow.create(data);
    }
    async findAll(companyId) {
        return Workflow.find({
            company: companyId,
            isActive: true,
        })
            .populate("businessService")
            .sort({ name: 1 });
    }
    async findById(id, companyId) {
        return Workflow.findOne({
            _id: id,
            company: companyId,
            isActive: true,
        }).populate("businessService");
    }
    async update(id, companyId, data) {
        return Workflow.findOneAndUpdate({
            _id: id,
            company: companyId,
            isActive: true,
        }, data, {
            new: true,
            runValidators: true,
        }).populate("businessService");
    }
    async deactivate(id, companyId) {
        return Workflow.findOneAndUpdate({
            _id: id,
            company: companyId,
            isActive: true,
        }, {
            isActive: false,
            active: false,
        }, {
            new: true,
        });
    }
    // ==========================================
    // WORKFLOW STEPS
    // ==========================================
    async createStep(data) {
        return WorkflowStep.create(data);
    }
    async shiftStepsFromOrder(companyId, workflowId, order) {
        return WorkflowStep.updateMany({ company: companyId, workflow: workflowId, order: { $gte: order }, isActive: true },
            { $inc: { order: 1 } });
    }
    async reorderSteps(companyId, workflowId, orderedActiveIds) {
        const allSteps = await WorkflowStep.find({ company: companyId, workflow: workflowId }).sort({ order: 1, createdAt: 1 });
        const activeById = new Map(allSteps.filter((step) => step.isActive).map((step) => [String(step._id), step]));
        const orderedActive = orderedActiveIds.map((id) => activeById.get(String(id))).filter(Boolean);
        if (orderedActive.length !== activeById.size) {
            throw new Error("The workflow stage list changed while it was being reordered. Reload and try again.");
        }
        const inactive = allSteps.filter((step) => !step.isActive);
        const orderedAll = [...orderedActive, ...inactive];
        // Move every row to a unique temporary negative order first. This avoids
        // transient collisions with the compound unique (company, workflow, order) index.
        for (let index = 0; index < orderedAll.length; index += 1) {
            await WorkflowStep.updateOne(
                { _id: orderedAll[index]._id, company: companyId, workflow: workflowId },
                { $set: { order: -(index + 1) } },
            );
        }
        for (let index = 0; index < orderedAll.length; index += 1) {
            await WorkflowStep.updateOne(
                { _id: orderedAll[index]._id, company: companyId, workflow: workflowId },
                { $set: { order: index + 1 } },
            );
        }
        return this.findSteps(companyId, workflowId);
    }
    async updateStep(companyId, workflowId, stepId, data) {
        return WorkflowStep.findOneAndUpdate({
            _id: stepId,
            company: companyId,
            workflow: workflowId,
            isActive: true,
        }, data, {
            new: true,
            runValidators: true,
        }).populate({ path: "position", match: { company: companyId } });
    }
    async reactivateStep(companyId, workflowId, stepId, data = {}) {
        return WorkflowStep.findOneAndUpdate({
            _id: stepId,
            company: companyId,
            workflow: workflowId,
            isActive: false,
        }, {
            ...data,
            isActive: true,
        }, {
            new: true,
            runValidators: true,
        }).populate({ path: "position", match: { company: companyId } });
    }
    async deactivateStep(companyId, workflowId, stepId) {
        return WorkflowStep.findOneAndUpdate({
            _id: stepId,
            company: companyId,
            workflow: workflowId,
            isActive: true,
        }, {
            isActive: false,
        }, {
            new: true,
        });
    }
    async findSteps(companyId, workflowId) {
        return WorkflowStep.find({
            company: companyId,
            workflow: workflowId,
            isActive: true,
        })
            .populate({
                path: "position",
                match: { company: companyId },
                populate: { path: "occupant", match: { company: companyId }, select: "_id firstName lastName email employeeNo" },
            })
            .sort({ order: 1 });
    }
    async findStepByOrder(companyId, workflowId, order) {
        return WorkflowStep.findOne({
            company: companyId,
            workflow: workflowId,
            order,
            isActive: true,
        }).populate({ path: "position", match: { company: companyId } });
    }
    async findFirstStep(companyId, workflowId) {
        return WorkflowStep.findOne({
            company: companyId,
            workflow: workflowId,
            isActive: true,
        })
            .sort({ order: 1 })
            .populate({ path: "position", match: { company: companyId } });
    }
    async findNextStep(companyId, workflowId, currentOrder) {
        return WorkflowStep.findOne({
            company: companyId,
            workflow: workflowId,
            order: {
                $gt: currentOrder,
            },
            isActive: true,
        })
            .sort({ order: 1 })
            .populate({ path: "position", match: { company: companyId } });
    }
    // ==========================================
    // WORKFLOW INSTANCES
    // ==========================================
    async createInstance(data) {
        return WorkflowInstance.create(data);
    }
    async findInstance(id, companyId) {
        return WorkflowInstance.findOne({
            _id: id,
            company: companyId,
            isActive: true,
            deletedAt: null,
        })
            .populate({ path: "workflow", match: {
                company: companyId,
                isActive: true
            } })
            .populate({
            path: "currentStep",
            match: {
                company: companyId,
                isActive: true
            },
            populate: {
                path: "position",
                match: { company: companyId },
                populate: {
                    path: "occupant",
                    match: { company: companyId },
                    select: "_id employeeNo firstName lastName email position employmentStatus active isActive",
                },
            },
        })
            .populate({ path: "currentPosition", match: { company: companyId } })
            .populate({ path: "currentEmployee", match: { company: companyId } })
            .populate({ path: "startedBy", match: { company: companyId } })
            .populate({ path: "completedBy", match: { company: companyId } })
            .populate({ path: "rejectedBy", match: { company: companyId } })
            .populate({ path: "cancelledBy", match: { company: companyId } });
    }
    async findInstanceByResource(companyId, resourceType, resourceId) {
        return WorkflowInstance.findOne({
            company: companyId,
            resourceType,
            resourceId,
            isActive: true,
            deletedAt: null,
            status: {
                $in: [
                    "running",
                    "pending",
                    "completed",
                ],
            },
        })
            .sort({ startedAt: -1, createdAt: -1 })
            .populate({ path: "workflow", match: {
                company: companyId,
                isActive: true
            } })
            .populate({
            path: "currentStep",
            match: {
                company: companyId,
                isActive: true
            },
            populate: {
                path: "position",
                match: { company: companyId },
                populate: {
                    path: "occupant",
                    match: { company: companyId },
                    select: "_id employeeNo firstName lastName email position employmentStatus active isActive",
                },
            },
        })
            .populate({ path: "currentPosition", match: { company: companyId } })
            .populate({ path: "currentEmployee", match: { company: companyId } });
    }
    async updateInstance(id, companyId, data) {
        return WorkflowInstance.findOneAndUpdate({
            _id: id,
            company: companyId,
            isActive: true,
            deletedAt: null,
        }, data, {
            new: true,
            runValidators: true,
        })
            .populate({ path: "workflow", match: {
                company: companyId,
                isActive: true
            } })
            .populate({
            path: "currentStep",
            match: {
                company: companyId,
                isActive: true
            },
            populate: {
                path: "position",
                match: { company: companyId },
                populate: {
                    path: "occupant",
                    match: { company: companyId },
                    select: "_id employeeNo firstName lastName email position employmentStatus active isActive",
                },
            },
        })
            .populate({ path: "currentPosition", match: { company: companyId } })
            .populate({ path: "currentEmployee", match: { company: companyId } })
            .populate({ path: "completedBy", match: { company: companyId } })
            .populate({ path: "rejectedBy", match: { company: companyId } })
            .populate({ path: "cancelledBy", match: { company: companyId } });
    }
}
export default new WorkflowRepository();
