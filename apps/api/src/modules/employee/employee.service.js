import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

import Company from "../company/company.model.js";
import Position from "../position/position.model.js";
import Role from "../auth/role.model.js";
import Employee from "./employee.model.js";
import EmployeeRepository from "./employee.repository.js";
import { validateCreateEmployee } from "./employee.validator.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function generateTemporaryPassword() {
  return `Mf-${crypto.randomBytes(5).toString("base64url")}`;
}

function publicEmployee(employee) {
  const result = employee?.toObject
    ? employee.toObject()
    : { ...employee };

  delete result.password;
  return result;
}

function assertObjectId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw createError(`${label} must be a valid id`);
  }
}

class EmployeeService {
  async generateEmployeeNo(companyId) {
    const company = await Company.findById(companyId)
      .select("code")
      .lean();

    const code =
      (company?.code || "MEM")
        .replace(/[^A-Z0-9]/gi, "")
        .slice(0, 5)
        .toUpperCase() || "MEM";
    const year = new Date().getFullYear().toString().slice(-2);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const number = Math.floor(1000 + Math.random() * 9000);
      const employeeNo = `${code}${year}${number}`;
      const existing = await EmployeeRepository.findByEmployeeNo(
        employeeNo,
        companyId
      );

      if (!existing) {
        return employeeNo;
      }
    }

    throw createError(
      "Unable to generate a unique employee number",
      500
    );
  }

  async validateRoleAndPosition(
    companyId,
    roleId,
    positionId,
    employeeId = null
  ) {
    let role = null;
    let position = null;

    if (roleId) {
      assertObjectId(roleId, "Role id");

      role = await Role.findOne({
        _id: roleId,
        company: companyId,
      });

      if (!role) {
        throw createError(
          "Selected role does not belong to this company."
        );
      }
    }

    if (positionId) {
      assertObjectId(positionId, "Position id");

      position = await Position.findOne({
        _id: positionId,
        company: companyId,
        active: true,
      });

      if (!position) {
        throw createError(
          "Selected position does not belong to this company."
        );
      }

      if (
        position.occupant &&
        (!employeeId ||
          position.occupant.toString() !== employeeId.toString())
      ) {
        throw createError("Selected position is already occupied.");
      }
    }

    return { role, position };
  }

  async createEmployee(companyId, payload) {
    const data = { ...payload };
    validateCreateEmployee(data);

    data.email = data.email.toLowerCase().trim();

    const existing = await EmployeeRepository.findByEmail(data.email);
    if (existing) {
      throw createError("Email already exists", 409);
    }

    const { role, position } = await this.validateRoleAndPosition(
      companyId,
      data.role,
      data.position
    );

    const createLogin = data.createLogin !== false;
    const temporaryPassword = createLogin
      ? data.password || generateTemporaryPassword()
      : null;

    data.company = companyId;
    data.employeeNo =
      data.employeeNo || (await this.generateEmployeeNo(companyId));
    data.password = await bcrypt.hash(
      temporaryPassword || crypto.randomBytes(24).toString("hex"),
      10
    );
    data.loginEnabled = createLogin;

    delete data.createLogin;
    delete data.passwordConfirmation;

    if (!role) {
      data.role = null;
    }

    if (!position) {
      data.position = null;
    }

    const employee = await EmployeeRepository.create(data);

    if (position) {
      position.occupant = employee._id;
      await position.save();
    }

    return {
      employee: publicEmployee(employee),
      temporaryPassword,
    };
  }

  async listEmployees(companyId) {
    return EmployeeRepository.findAll(companyId);
  }

  async getEmployee(companyId, id) {
    assertObjectId(id, "Employee id");

    const employee = await EmployeeRepository.findById(
      id,
      companyId
    );

    if (!employee) {
      throw createError("Employee not found", 404);
    }

    return employee;
  }

  async updateEmployee(companyId, id, payload) {
    assertObjectId(id, "Employee id");

    const current = await EmployeeRepository.findById(
      id,
      companyId
    );

    if (!current) {
      throw createError("Employee not found", 404);
    }

    const data = { ...payload };

    delete data.company;
    delete data.employeeNo;
    delete data.password;
    delete data.passwordConfirmation;

    if (data.email) {
      data.email = data.email.toLowerCase().trim();

      const duplicate = await EmployeeRepository.findByEmail(
        data.email
      );

      if (
        duplicate &&
        duplicate._id.toString() !== id.toString()
      ) {
        throw createError("Email already exists", 409);
      }
    }

    if (data.role !== undefined && data.role !== null) {
      await this.validateRoleAndPosition(
        companyId,
        data.role,
        null,
        id
      );
    }

    if (data.position !== undefined) {
      const oldPositionId = current.position?._id || current.position;

      if (data.position) {
        await this.validateRoleAndPosition(
          companyId,
          null,
          data.position,
          id
        );

        if (
          oldPositionId &&
          oldPositionId.toString() !== data.position.toString()
        ) {
          await EmployeeRepository.clearPositionOccupant(
            oldPositionId,
            id
          );
        }

        await EmployeeRepository.setPositionOccupant(
          data.position,
          id
        );
      } else if (oldPositionId) {
        await EmployeeRepository.clearPositionOccupant(
          oldPositionId,
          id
        );
      }
    }

    const employee = await EmployeeRepository.update(
      id,
      companyId,
      data
    );

    if (!employee) {
      throw createError("Employee not found", 404);
    }

    return employee;
  }

  async resetPassword(companyId, id, password = null) {
    assertObjectId(id, "Employee id");

    const employee = await EmployeeRepository.findById(
      id,
      companyId
    );

    if (!employee) {
      throw createError("Employee not found", 404);
    }

    const temporaryPassword = password || generateTemporaryPassword();

    if (temporaryPassword.length < 6) {
      throw createError("Password must be at least 6 characters");
    }

    await EmployeeRepository.updatePassword(
      id,
      companyId,
      await bcrypt.hash(temporaryPassword, 10)
    );

    return {
      employee: publicEmployee(employee),
      temporaryPassword,
    };
  }

  async deleteEmployee(companyId, id) {
    assertObjectId(id, "Employee id");

    const employee = await EmployeeRepository.deactivate(
      id,
      companyId
    );

    if (!employee) {
      throw createError("Employee not found", 404);
    }

    const positionId = employee.position?._id || employee.position;

    if (positionId) {
      await EmployeeRepository.clearPositionOccupant(
        positionId,
        id
      );
    }

    return employee;
  }
}

export default new EmployeeService();
