import Position from "./position.model.js";
import Employee from "../employee/employee.model.js";

const populate = [
  { path: "sbu" },
  { path: "department" },
  { path: "designation" },
  { path: "occupant" },
  { path: "reportsTo" },
];

class PositionRepository {
  async create(payload) {
    return Position.create(payload);
  }

  async findAll(companyId) {
    return Position.find({
      company: companyId,
      active: true,
    })
      .populate(populate)
      .sort("title");
  }

  async findById(id, companyId) {
    return Position.findOne({
      _id: id,
      company: companyId,
      active: true,
    }).populate(populate);
  }

  async update(id, companyId, payload) {
    return Position.findOneAndUpdate(
      { _id: id, company: companyId, active: true },
      payload,
      { new: true, runValidators: true }
    ).populate(populate);
  }

  async deactivate(id, companyId) {
    return Position.findOneAndUpdate(
      { _id: id, company: companyId, active: true },
      { active: false },
      { new: true }
    );
  }

  async assignEmployee(positionId, companyId, employeeId) {
    const position = await Position.findOneAndUpdate(
      { _id: positionId, company: companyId, active: true },
      { occupant: employeeId },
      { new: true }
    );

    if (!position) throw new Error("Position not found");

    await Employee.findOneAndUpdate(
      { _id: employeeId, company: companyId },
      { position: positionId }
    );

    return position;
  }

  async vacate(positionId, companyId) {
    const position = await Position.findOne({
      _id: positionId,
      company: companyId,
      active: true,
    });

    if (!position) throw new Error("Position not found");

    const employeeId = position.occupant;
    position.occupant = null;
    await position.save();

    if (employeeId) {
      await Employee.findOneAndUpdate(
        { _id: employeeId, company: companyId },
        { position: null }
      );
    }

    return position;
  }
}

export default new PositionRepository();
