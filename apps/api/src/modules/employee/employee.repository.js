import Employee from "./employee.model.js";

const populateEmployee = (query) =>
  query
    .populate("company")
    .populate("position")
    .populate("role");

class EmployeeRepository {
  async create(data) {
    return Employee.create(data);
  }

  async findById(id, companyId = null) {
    const filter = {
      _id: id,
      active: true,
      deletedAt: null,
    };

    if (companyId) {
      filter.company = companyId;
    }

    return populateEmployee(Employee.findOne(filter));
  }

  async findByEmail(email, companyId = null, includePassword = false) {
    const filter = {
      email: email.toLowerCase(),
      active: true,
      deletedAt: null,
    };

    if (companyId) {
      filter.company = companyId;
    }

    let query = Employee.findOne(filter);

    if (includePassword) {
      query = query.select("+password");
    }

    return populateEmployee(query);
  }

  async findByEmployeeNo(employeeNo, companyId = null) {
    const filter = {
      employeeNo,
      active: true,
      deletedAt: null,
    };

    if (companyId) {
      filter.company = companyId;
    }

    return Employee.findOne(filter);
  }

  async findAll(companyId) {
    return populateEmployee(
      Employee.find({
        company: companyId,
        active: true,
        deletedAt: null,
      }).sort({ createdAt: -1 })
    );
  }

  async update(id, companyId, payload) {
    return populateEmployee(
      Employee.findOneAndUpdate(
        {
          _id: id,
          company: companyId,
          deletedAt: null,
        },
        payload,
        {
          new: true,
          runValidators: true,
        }
      )
    );
  }

  async deactivate(id, companyId) {
    return populateEmployee(
      Employee.findOneAndUpdate(
        {
          _id: id,
          company: companyId,
          deletedAt: null,
        },
        {
          active: false,
          employmentStatus: "Inactive",
          deletedAt: new Date(),
          loginEnabled: false,
        },
        { new: true }
      )
    );
  }

  async updatePassword(id, companyId, passwordHash) {
    return Employee.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        deletedAt: null,
      },
      {
        password: passwordHash,
        loginEnabled: true,
        active: true,
        employmentStatus: "Active",
      },
      { new: true }
    );
  }

  async clearPositionOccupant(positionId, employeeId) {
    const Position = (
      await import("../position/position.model.js")
    ).default;

    return Position.updateOne(
      {
        _id: positionId,
        occupant: employeeId,
      },
      {
        $set: { occupant: null },
      }
    );
  }

  async setPositionOccupant(positionId, employeeId) {
    const Position = (
      await import("../position/position.model.js")
    ).default;

    return Position.findOneAndUpdate(
      {
        _id: positionId,
        occupant: null,
        active: true,
      },
      {
        $set: { occupant: employeeId },
      },
      { new: true }
    );
  }
}

export default new EmployeeRepository();
