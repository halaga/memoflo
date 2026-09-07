import Position from "../position/position.model.js";
import Employee from "../employee/employee.model.js";

class WorkflowResolver {
  /**
   * Resolve a workflow position into:
   *
   * Position
   * +
   * Employee occupying that position
   */
  async resolvePosition(
    positionId,
    companyId
  ) {
    if (!positionId) {
      throw new Error(
        "Workflow position is required"
      );
    }

    if (!companyId) {
      throw new Error(
        "Workflow company is required"
      );
    }

    const position =
      await Position.findOne({
        _id: positionId,
        company: companyId,
        isActive: true,
        active: true,
        isWorkflowNode: true,
      }).populate({
        path: "occupant",
        model: Employee,
        select:
          "_id employeeNo firstName lastName email position employmentStatus active isActive",
      });

    if (!position) {
      throw new Error(
        "Workflow position not found"
      );
    }

    if (!position.occupant) {
      throw new Error(
        `Position "${position.title}" has no occupant`
      );
    }

    const employee =
      position.occupant;

    if (
      !employee.active ||
      !employee.isActive ||
      employee.employmentStatus !==
        "Active"
    ) {
      throw new Error(
        `Employee occupying "${position.title}" is inactive`
      );
    }

    return {
      position,
      employee,
    };
  }

  /**
   * Resolve multiple workflow positions
   */
  async resolvePositions(
    positionIds,
    companyId
  ) {
    if (
      !Array.isArray(positionIds)
    ) {
      throw new Error(
        "Position IDs must be an array"
      );
    }

    if (!companyId) {
      throw new Error(
        "Workflow company is required"
      );
    }

    const results = [];

    for (
      const positionId of positionIds
    ) {
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