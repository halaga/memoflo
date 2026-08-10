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
    return Employee.findOne({ employeeNo });
  }

  async findAll(companyId) {
    return Employee.find({
      company: companyId,
      active: true,
    })
      .populate("position")
      .populate("role")
      .sort({
        createdAt: -1,
      });
  }

  async update(id, payload) {
    return Employee.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  }

  async deactivate(id) {
    return Employee.findByIdAndUpdate(
      id,
      {
        active: false,
        employmentStatus: "Inactive",
      },
      { new: true }
    );
  }

  async create(data) {
    return Employee.create(data);
}

async findAll(company) {
    return Employee.find({ company, deletedAt: null })
        .populate("position")
        .populate("role");
}

async findById(id) {
    return Employee.findById(id)
        .populate("company")
        .populate("position")
        .populate("role");
}

async update(id, data) {
    return Employee.findByIdAndUpdate(
        id,
        data,
        { new: true }
    );
}

async softDelete(id) {
    return Employee.findByIdAndUpdate(
        id,
        {
            deletedAt: new Date(),
            active: false,
        },
        { new: true }
    );
}

}

export default new EmployeeRepository();