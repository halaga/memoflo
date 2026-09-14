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
    })
      .select("+password")
      .populate("company")
      .populate("role")
      .populate("position");
  }

  async findByEmployeeNo(employeeNo) {
    return Employee.findOne({
      employeeNo,
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
      .sort({
        createdAt: -1,
      });
  }

  async update(id, data) {
    return Employee.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("company")
      .populate("position")
      .populate("role");
  }

  async softDelete(id) {
    return Employee.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        active: false,
        employmentStatus: "Inactive",
      },
      {
        new: true,
      }
    );
  }
}

export default new EmployeeRepository();