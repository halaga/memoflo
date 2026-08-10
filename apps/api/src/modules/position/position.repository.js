import Position from "./position.model.js";

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
  return Position.findByIdAndUpdate(
    positionId,
    {
      occupant: employeeId,
    },
    {
      new: true,
      runValidators: true,
    }
  );
}

async vacate(positionId) {
  return Position.findByIdAndUpdate(
    positionId,
    {
      occupant: null,
    },
    {
      new: true,
    }
  );
}

}

export default new PositionRepository();