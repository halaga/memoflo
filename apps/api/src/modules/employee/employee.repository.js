import Employee from "./employee.model.js";

class EmployeeRepository {
  async create(data) {
    return Employee.create(data);
  }

  async findById(id) {
    return Employee.findById(id)
      .populate("company")
      .populate("position")
      .populate("role");
  }

  async findByEmail(email) {
    return Employee.findOne({
      email: email.toLowerCase(),
      active: true,
    })
      .select("+password")
      .populate("company")
      .populate("role")
      .populate("position");
  }

  async findByEmployeeNo(employeeNo) {
    return Employee.findOne({
      employeeNo,
      active: true,
    });
  }

  async findAll(companyId) {
    return Employee.find({
      company: companyId,
      active: true,
      deletedAt: null,
    })
      .populate("position")
      .populate("role")
      .sort({ createdAt: -1 });
  }

  async update(id, payload) {
    return Employee.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      payload,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("company")
      .populate("position")
      .populate("role");
  }

  async deactivate(id) {
    return Employee.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        active: false,
        employmentStatus: "Inactive",
        deletedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  async softDelete(id) {
    return this.deactivate(id);
  }
}

export default new EmployeeRepository();
