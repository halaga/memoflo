import Employee from "../employee/employee.model.js";
import Position from "./position.model.js";

const positionPopulate = [
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
      deletedAt: null,
    })
      .populate(positionPopulate)
      .sort({ title: 1 });
  }

  async findById(id, companyId) {
    return Position.findOne({
      _id: id,
      company: companyId,
      active: true,
      deletedAt: null,
    }).populate(positionPopulate);
  }

  async update(id, companyId, payload) {
    return Position.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        active: true,
        deletedAt: null,
      },
      payload,
      {
        new: true,
        runValidators: true,
      }
    ).populate(positionPopulate);
  }

  async deactivate(id, companyId) {
    return Position.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        active: true,
        deletedAt: null,
      },
      {
        active: false,
        deletedAt: new Date(),
      },
      { new: true }
    );
  }

  async assignEmployee(positionId, companyId, employeeId) {
    const position = await Position.findOneAndUpdate(
      {
        _id: positionId,
        company: companyId,
        active: true,
        occupant: null,
      },
      { occupant: employeeId },
      { new: true }
    );

    if (!position) {
      throw new Error("Position is unavailable or already occupied");
    }

    await Employee.findOneAndUpdate(
      {
        _id: employeeId,
        company: companyId,
      },
      { position: positionId }
    );

    return position.populate(positionPopulate);
  }

  async vacate(positionId, companyId) {
    const position = await Position.findOne({
      _id: positionId,
      company: companyId,
      active: true,
      deletedAt: null,
    });

    if (!position) {
      throw new Error("Position not found");
    }

    const employeeId = position.occupant;
    position.occupant = null;
    await position.save();

    if (employeeId) {
      await Employee.findOneAndUpdate(
        {
          _id: employeeId,
          company: companyId,
        },
        { position: null }
      );
    }

    return position.populate(positionPopulate);
  }
}

export default new PositionRepository();
