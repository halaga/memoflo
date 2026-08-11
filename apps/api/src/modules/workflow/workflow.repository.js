import Workflow from "./workflow.model.js";
import WorkflowStep from "./workflowStep.model.js";

class WorkflowRepository {
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
    return Workflow.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deactivate(id, companyId) {
    return Workflow.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
      },
      {
        isActive: false,
        active: false,
      },
      {
        new: true,
      }
    );
  }

  async createStep(data) {
    return WorkflowStep.create(data);
  }

  async findSteps(workflowId) {
    return WorkflowStep.find({
      workflow: workflowId,
      isActive: true,
    })
      .populate("position")
      .sort({ order: 1 });
  }
}

export default new WorkflowRepository();