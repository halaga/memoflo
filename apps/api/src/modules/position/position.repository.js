import Position from "./position.model.js";
import Employee from "../employee/employee.model.js";

class PositionRepository {
  async create(payload) {
    return await Position.create(payload);
  }

  async findAll(companyId) {
    return await Position.find({
      company: companyId,
      active: true,
    })
      .populate("sbu")
      .populate("department")
      .populate("designation")
      .populate("occupant")
      .populate("reportsTo")
      .sort("title");
  }

  async findById(id) {
    return await Position.findById(id)
      .populate("sbu")
      .populate("department")
      .populate("designation")
      .populate("occupant")
      .populate("reportsTo");
  }

  async update(id, payload) {
    return await Position.findByIdAndUpdate(
      id,
      payload,
      { new: true }
    );
  }

  async deactivate(id) {
    return await Position.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
  }

 async assignEmployee(positionId, employeeId) {
  const position = await Position.findByIdAndUpdate(
    positionId,
    {
      occupant: employeeId,
    },
    {
      new: true,
    }
  );

  if (!position) {
    throw new Error("Position not found");
  }

  await Employee.findByIdAndUpdate(
    employeeId,
    {
      position: positionId,
    }
  );

  return position;
}

async vacate(positionId) {
  const position = await Position.findById(positionId);

  if (!position) {
    throw new Error("Position not found");
  }

  const employeeId = position.occupant;

  position.occupant = null;
  await position.save();

  if (employeeId) {
    await Employee.findByIdAndUpdate(
      employeeId,
      {
        position: null,
      }
    );
  }

  return position;
}

}

export default new PositionRepository();