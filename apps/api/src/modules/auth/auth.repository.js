import Employee from "../employee/employee.model.js";

class AuthRepository {
  async findByEmail(email, companySlug = null) {
    const employee = await Employee.findOne({
      email: email.toLowerCase(),
      active: true,
      loginEnabled: true,
      employmentStatus: "Active",
      deletedAt: null,
    })
      .select("+password")
      .populate("company")
      .populate("role")
      .populate("position");

    if (!employee) {
      return null;
    }

    if (
      companySlug &&
      employee.company?.slug !== String(companySlug).toLowerCase()
    ) {
      return null;
    }

    return employee;
  }

  async updateLastLogin(id) {
    return Employee.findByIdAndUpdate(
      id,
      { lastLogin: new Date() },
      { new: true }
    );
  }

  async findById(id) {
    return Employee.findOne({
      _id: id,
      active: true,
      loginEnabled: true,
      employmentStatus: "Active",
      deletedAt: null,
    })
      .populate("company")
      .populate("role")
      .populate("position")
      .select("-password");
  }
}

export default new AuthRepository();
