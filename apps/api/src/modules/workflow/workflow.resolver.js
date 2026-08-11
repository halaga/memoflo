import Position from "../position/position.model.js";
import Employee from "../employee/employee.model.js";

class WorkflowResolver {
  async resolvePosition(positionId, companyId) {
    const position = await Position.findOne({
      _id: positionId,
      company: companyId,
      isActive: true,
    }).populate({
      path: "occupant",
      model: Employee,
      select:
        "_id employeeNo firstName lastName email position",
    });

    if (!position) {
      throw new Error("Workflow position not found");
    }

    if (!position.isWorkflowNode) {
      throw new Error(
        "Position is not configured as a workflow node"
      );
    }

    if (!position.occupant) {
      throw new Error(
        `Position "${position.title}" has no active occupant`
      );
    }

    return {
      position,
      employee: position.occupant,
    };
  }

  async resolvePositions(positionIds, companyId) {
    const results = [];

    for (const positionId of positionIds) {
      results.push(
        await this.resolvePosition(
          positionId,
          companyId
        )
      );
    }

    return results;
  }
}

export default new WorkflowResolver();