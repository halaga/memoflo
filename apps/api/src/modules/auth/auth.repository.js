import Employee from "../employee/employee.model.js";

class AuthRepository {
  async findByEmail(email) {
    return Employee.findOne({
      email: email.toLowerCase(),
    })
      .populate("company")
      .populate("role")
      .populate("position");
  }

  async updateLastLogin(id) {
    return Employee.findByIdAndUpdate(id, {
      lastLogin: new Date(),
    });
  }
}

export default new AuthRepository();