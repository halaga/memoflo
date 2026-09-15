import bcrypt from "bcryptjs";
import crypto from "crypto";
import Company from "../company/company.model.js";
import Employee from "./employee.model.js";
import Role from "../auth/role.model.js";
import Position from "../position/position.model.js";
import EmployeeRepository from "./employee.repository.js";
import { validateCreateEmployee } from "./employee.validator.js";

function generateTemporaryPassword() {
  return `Mf-${crypto.randomBytes(5).toString("base64url")}`;
}

function publicEmployee(employee) {
  const result = employee?.toObject ? employee.toObject() : { ...employee };
  delete result.password;
  return result;
}

class EmployeeService {
  async generateEmployeeNo(companyId) {
    const company = await Company.findById(companyId).select("code").lean();
    const code = (company?.code || "MEM").replace(/[^A-Z0-9]/gi, "").slice(0, 5).toUpperCase() || "MEM";
    const year = new Date().getFullYear().toString().slice(-2);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const number = Math.floor(1000 + Math.random() * 9000);
      const employeeNo = `${code}${year}${number}`;
      if (!(await EmployeeRepository.findByEmployeeNo(employeeNo, companyId))) return employeeNo;
    }

    throw new Error("Unable to generate a unique employee number");
  }

  async validateRoleAndPosition(companyId, roleId, positionId) {
    let role = null;
    let position = null;

    if (roleId) {
      role = await Role.findOne({ _id: roleId, company: companyId });
      if (!role) throw new Error("Selected role does not belong to this company");
    }

    if (positionId) {
      position = await Position.findOne({ _id: positionId, company: companyId, active: true });
      if (!position) throw new Error("Selected position does not belong to this company");
      if (position.occupant) throw new Error("Selected position is already occupied");
    }

    return { role, position };
  }

  async createEmployee(companyId, payload) {
    const data = { ...payload };
    validateCreateEmployee(data);
    data.email = data.email.toLowerCase().trim();

    const existing = await EmployeeRepository.findByEmail(data.email);
    if (existing) throw new Error("Email already exists");

    const { role, position } = await this.validateRoleAndPosition(companyId, data.role, data.position);
    const createLogin = data.createLogin !== false;
    const temporaryPassword = createLogin ? (data.password || generateTemporaryPassword()) : null;

    data.company = companyId;
    data.employeeNo = data.employeeNo || (await this.generateEmployeeNo(companyId));
    data.password = await bcrypt.hash(temporaryPassword || crypto.randomBytes(24).toString("hex"), 10);
    data.loginEnabled = createLogin;
    delete data.createLogin;
    if (!role) data.role = null;
    if (!position) data.position = null;

    const employee = await EmployeeRepository.create(data);

    if (position) {
      position.occupant = employee._id;
      await position.save();
    }

    return { employee: publicEmployee(employee), temporaryPassword };
  }

  async listEmployees(companyId) {
    return EmployeeRepository.findAll(companyId);
  }

  async getEmployee(companyId, id) {
    const employee = await EmployeeRepository.findById(id, companyId);
    if (!employee) throw new Error("Employee not found");
    return employee;
  }

  async updateEmployee(companyId, id, payload) {
    const current = await EmployeeRepository.findById(id, companyId);
    if (!current) throw new Error("Employee not found");

    const data = { ...payload };
    delete data.company;
    delete data.employeeNo;
    delete data.password;

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
      const duplicate = await EmployeeRepository.findByEmail(data.email);
      if (duplicate && duplicate._id.toString() !== id.toString()) throw new Error("Email already exists");
    }

    if (data.role !== undefined && data.role !== null) {
      const role = await Role.findOne({ _id: data.role, company: companyId });
      if (!role) throw new Error("Selected role does not belong to this company");
    }

    if (data.position !== undefined) {
      if (data.position) {
        const position = await Position.findOne({ _id: data.position, company: companyId, active: true });
        if (!position) throw new Error("Selected position does not belong to this company");
        if (position.occupant && position.occupant.toString() !== id.toString()) {
          throw new Error("Selected position is already occupied");
        }
        if (current.position && current.position._id?.toString() !== data.position.toString()) {
          await EmployeeRepository.clearPositionOccupant(current.position._id, id);
        }
        await EmployeeRepository.setPositionOccupant(data.position, id);
      } else if (current.position) {
        await EmployeeRepository.clearPositionOccupant(current.position._id, id);
      }
    }

    const employee = await EmployeeRepository.update(id, companyId, data);
    if (!employee) throw new Error("Employee not found");
    return employee;
  }

  async resetPassword(companyId, id, password = null) {
    const employee = await EmployeeRepository.findById(id, companyId);
    if (!employee) throw new Error("Employee not found");

    const temporaryPassword = password || generateTemporaryPassword();
    if (temporaryPassword.length < 6) throw new Error("Password must be at least 6 characters");

    await EmployeeRepository.updatePassword(id, companyId, await bcrypt.hash(temporaryPassword, 10));
    return { employee: publicEmployee(employee), temporaryPassword };
  }

  async deleteEmployee(companyId, id) {
    const employee = await EmployeeRepository.deactivate(id, companyId);
    if (!employee) throw new Error("Employee not found");

    if (employee.position?._id) {
      await EmployeeRepository.clearPositionOccupant(employee.position._id, id);
    }

    return employee;
  }
}

export default new EmployeeService();
