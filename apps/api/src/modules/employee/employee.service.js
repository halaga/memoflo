import bcrypt from "bcryptjs";
import EmployeeRepository from "./employee.repository.js";
import { validateCreateEmployee } from "./employee.validator.js";

class EmployeeService {
  async generateEmployeeNo(companyCode = "MEM") {
    const year = new Date().getFullYear().toString().slice(-2);
    return `${companyCode}${year}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async createEmployee(companyId, payload) {
    const data = { ...payload, company: companyId };
    validateCreateEmployee(data);
    const existing = await EmployeeRepository.findByEmail(data.email);
    if (existing) throw new Error("Email already exists");
    data.employeeNo = data.employeeNo || await this.generateEmployeeNo();
    data.password = await bcrypt.hash(data.password, 10);
    const employee = await EmployeeRepository.create(data);
    const result = employee.toObject(); delete result.password; return result;
  }

  async listEmployees(companyId) { return EmployeeRepository.findAll(companyId); }

  async getEmployee(id, companyId) {
    const employee = await EmployeeRepository.findById(id, companyId);
    if (!employee) throw new Error("Employee not found");
    return employee;
  }

  async updateEmployee(id, companyId, payload) {
    const data = { ...payload };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    const employee = await EmployeeRepository.update(id, companyId, data);
    if (!employee) throw new Error("Employee not found");
    return employee;
  }

  async deleteEmployee(id, companyId) {
    const employee = await EmployeeRepository.deactivate(id, companyId);
    if (!employee) throw new Error("Employee not found");
    return employee;
  }
}

export default new EmployeeService();
