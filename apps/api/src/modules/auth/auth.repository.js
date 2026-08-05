import Employee from "../employee/employee.model.js";

class AuthRepository {
  async findByEmail(email) {
    return Employee.findOne({
      email: email.toLowerCase(),
    })
      .select("+password")
      .populate("company")
      .populate("role")
      .populate("position");
  }

  async updateLastLogin(id) {
    return Employee.findByIdAndUpdate(id, {
      lastLogin: new Date(),
    });
  }

  async findById(id) {
  return Employee.findById(id)
    .populate("company")
    .populate("role")
    .populate("position")
    .select("-password");
}
}

export default new AuthRepository();