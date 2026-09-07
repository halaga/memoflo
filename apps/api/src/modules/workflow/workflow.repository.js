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

  async findById(
    id,
    companyId
  ) {
    return Workflow.findOne({
      _id: id,
      company: companyId,
      isActive: true,
    }).populate("businessService");
  }

  async update(
    id,
    companyId,
    data
  ) {
    return Workflow.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    ).populate("businessService");
  }

  async deactivate(
    id,
    companyId
  ) {
    return Workflow.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
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

  // ==========================================
  // WORKFLOW STEPS
  // ==========================================

  async createStep(data) {
    return WorkflowStep.create(data);
  }

async updateStep(
  workflowId,
  stepId,
  data
) {
  return WorkflowStep.findOneAndUpdate(
    {
      _id: stepId,
      workflow: workflowId,
      isActive: true,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  ).populate("position");
}

async reactivateStep(
  workflowId,
  stepId,
  data = {}
) {
  return WorkflowStep.findOneAndUpdate(
    {
      _id: stepId,
      workflow: workflowId,
      isActive: false,
    },
    {
      ...data,
      isActive: true,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("position");
}

async deactivateStep(
  workflowId,
  stepId
) {
  return WorkflowStep.findOneAndUpdate(
    {
      _id: stepId,
      workflow: workflowId,
      isActive: true,
    },
    {
      isActive: false,
    },
    {
      new: true,
    }
  );
}

  async findSteps(workflowId) {
    return WorkflowStep.find({
      workflow: workflowId,
      isActive: true,
    })
      .populate("position")
      .sort({ order: 1 });
  }

  async findStepByOrder(
    workflowId,
    order
  ) {
    return WorkflowStep.findOne({
      workflow: workflowId,
      order,
      isActive: true,
    }).populate("position");
  }

  async findFirstStep(
    workflowId
  ) {
    return WorkflowStep.findOne({
      workflow: workflowId,
      isActive: true,
    })
      .sort({ order: 1 })
      .populate("position");
  }

  async findNextStep(
    workflowId,
    currentOrder
  ) {
    return WorkflowStep.findOne({
      workflow: workflowId,

      order: {
        $gt: currentOrder,
      },

      isActive: true,
    })
      .sort({ order: 1 })
      .populate("position");
  }

  // ==========================================
  // WORKFLOW INSTANCES
  // ==========================================

  async createInstance(data) {
    return WorkflowInstance.create(
      data
    );
  }

  async findInstance(
    id,
    companyId
  ) {
    return WorkflowInstance.findOne({
      _id: id,

      company: companyId,

      isActive: true,
    })
      .populate("workflow")

      .populate({
        path: "currentStep",

        populate: {
          path: "position",

          populate: {
            path: "occupant",

            select:
              "_id employeeNo firstName lastName email position employmentStatus active isActive",
          },
        },
      })

      .populate("currentPosition")
      .populate("currentEmployee")

      .populate("startedBy")
      .populate("completedBy")
      .populate("rejectedBy")
      .populate("cancelledBy");
  }

  async findInstanceByResource(
    companyId,
    resourceType,
    resourceId
  ) {
    return WorkflowInstance.findOne({
      company: companyId,

      resourceType,

      resourceId,

      isActive: true,

      status: {
        $in: [
          "running",
          "pending",
        ],
      },
    })

      .populate("workflow")

      .populate({
        path: "currentStep",

        populate: {
          path: "position",

          populate: {
            path: "occupant",

            select:
              "_id employeeNo firstName lastName email position employmentStatus active isActive",
          },
        },
      })

      .populate("currentPosition")
      .populate("currentEmployee");
  }

  async updateInstance(
    id,
    companyId,
    data
  ) {
    return WorkflowInstance.findOneAndUpdate(
      {
        _id: id,

        company: companyId,

        isActive: true,
      },

      data,

      {
        new: true,

        runValidators: true,
      }
    )

      .populate("workflow")

      .populate({
        path: "currentStep",

        populate: {
          path: "position",

          populate: {
            path: "occupant",

            select:
              "_id employeeNo firstName lastName email position employmentStatus active isActive",
          },
        },
      })

      .populate("currentPosition")
      .populate("currentEmployee")

      .populate("completedBy")
      .populate("rejectedBy")
      .populate("cancelledBy");
  }
}

export default new WorkflowRepository();