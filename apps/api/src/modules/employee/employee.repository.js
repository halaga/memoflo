import Employee from "./employee.model.js";

class EmployeeRepository {
  async create(data) { return Employee.create(data); }

  async findById(id, companyId = null) {
    const filter = { _id: id, active: true, deletedAt: null };
    if (companyId) filter.company = companyId;
    return Employee.findOne(filter).populate("company").populate("position").populate("role");
  }

  async findByEmail(email) {
    return Employee.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("company")
      .populate("role")
      .populate("position");
  }

  async findByEmployeeNo(employeeNo, companyId = null) {
    const filter = { employeeNo };
    if (companyId) filter.company = companyId;
    return Employee.findOne(filter);
  }

  async findAll(companyId) {
    return Employee.find({ company: companyId, active: true, deletedAt: null })
      .populate("position")
      .populate("role")
      .sort({ createdAt: -1 });
  }

  async update(id, companyId, payload) {
    return Employee.findOneAndUpdate(
      { _id: id, company: companyId, active: true, deletedAt: null },
      payload,
      { new: true, runValidators: true }
    ).populate("company").populate("position").populate("role");
  }

  async deactivate(id, companyId) {
    return Employee.findOneAndUpdate(
      { _id: id, company: companyId, active: true, deletedAt: null },
      { active: false, employmentStatus: "Inactive", deletedAt: new Date() },
      { new: true }
    );
  }
}

export default new EmployeeRepository();
