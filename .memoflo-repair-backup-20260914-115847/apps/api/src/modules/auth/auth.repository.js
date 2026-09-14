import Employee from "../employee/employee.model.js";
class AuthRepository {
  async findByEmail(email, companySlug = null) {
    const query = { email: email.toLowerCase() };
    const employeeQuery = Employee.findOne(query).select("+password").populate("company").populate("role").populate("position");
    const employee = await employeeQuery;
    if (!employee) return null;
    if (companySlug && employee.company?.slug !== String(companySlug).toLowerCase()) return null;
    return employee;
  }
  async updateLastLogin(id) { return Employee.findByIdAndUpdate(id, { lastLogin: new Date() }); }
  async findById(id) { return Employee.findById(id).populate("company").populate("role").populate("position").select("-password"); }
}
export default new AuthRepository();
