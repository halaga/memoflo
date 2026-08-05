import bcrypt from "bcryptjs";
import EmployeeRepository from "./employee.repository.js";

class EmployeeService {
  async generateEmployeeNo(companyCode = "MEM") {
    const year = new Date().getFullYear().toString().slice(-2);

    const random = Math.floor(1000 + Math.random() * 9000);

    return `${companyCode}${year}${random}`;
  }

  async createEmployee(payload) {
    const existing = await EmployeeRepository.findByEmail(payload.email);

    if (existing) {
      throw new Error("Email already exists");
    }

    payload.employeeNo = await this.generateEmployeeNo();

    payload.password = await bcrypt.hash(
      payload.password,
      10
    );

    return EmployeeRepository.create(payload);
  }

  async getEmployees(companyId) {
    return EmployeeRepository.findAll(companyId);
  }

  async getEmployee(id) {
    return EmployeeRepository.findById(id);
  }

  async updateEmployee(id, payload) {
    return EmployeeRepository.update(id, payload);
  }

  async deactivateEmployee(id) {
    return EmployeeRepository.deactivate(id);
  }
}

export default new EmployeeService();