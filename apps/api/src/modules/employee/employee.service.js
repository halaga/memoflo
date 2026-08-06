import bcrypt from "bcryptjs";
import EmployeeRepository from "./employee.repository.js";
import { validateCreateEmployee } from "./employee.validator.js";

class EmployeeService {
  async generateEmployeeNo(companyCode = "MEM") {
    const year = new Date().getFullYear().toString().slice(-2);

    const random = Math.floor(1000 + Math.random() * 9000);

    return `${companyCode}${year}${random}`;
  }

  async createEmployee(payload) {
    validateCreateEmployee(payload);

    const existing = await EmployeeRepository.findByEmail(
      payload.email
    );

    if (existing) {
      throw new Error("Email already exists");
    }

    payload.employeeNo =
      payload.employeeNo ||
      (await this.generateEmployeeNo());

    payload.password = await bcrypt.hash(
      payload.password,
      10
    );

    const employee =
      await EmployeeRepository.create(payload);

    const result = employee.toObject();
    delete result.password;

    return result;
  }

  async listEmployees(companyId) {
    return EmployeeRepository.findAll(companyId);
  }

  async getEmployee(id) {
    const employee =
      await EmployeeRepository.findById(id);

    if (!employee) {
      throw new Error("Employee not found");
    }

    return employee;
  }

  async updateEmployee(id, payload) {
    const employee =
      await EmployeeRepository.update(id, payload);

    if (!employee) {
      throw new Error("Employee not found");
    }

    return employee;
  }

  async deleteEmployee(id) {
    const employee =
      await EmployeeRepository.softDelete(id);

    if (!employee) {
      throw new Error("Employee not found");
    }

    return employee;
  }
}

export default new EmployeeService();