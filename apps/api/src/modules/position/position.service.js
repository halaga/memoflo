import mongoose from "mongoose";

import Department from "../organization/department/department.model.js";
import Designation from "../organization/designation/designation.model.js";
import SBU from "../organization/sbu/sbu.model.js";
import Employee from "../employee/employee.model.js";
import PositionRepository from "./position.repository.js";
import {
  cleanPositionPayload,
  validateCreatePosition,
} from "./position.validator.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw createError(`${label} must be a valid id`);
  }
}

async function validateRelations(companyId, data) {
  const [sbu, department, designation] = await Promise.all([
    SBU.findOne({
      _id: data.sbu,
      company: companyId,
      isActive: true,
      deletedAt: null,
    }).select("_id"),
    Department.findOne({
      _id: data.department,
      company: companyId,
      isActive: true,
      deletedAt: null,
    }).select("_id sbu"),
    Designation.findOne({
      _id: data.designation,
      company: companyId,
      isActive: true,
      deletedAt: null,
    }).select("_id department sbu"),
  ]);

  if (!sbu) {
    throw createError("Selected SBU is not available in this company.");
  }

  if (!department) {
    throw createError(
      "Selected department is not available in this company."
    );
  }

  if (!designation) {
    throw createError(
      "Selected designation is not available in this company."
    );
  }

  if (department.sbu?.toString() !== data.sbu.toString()) {
    throw createError(
      "Department does not belong to the selected SBU."
    );
  }

  if (designation.sbu?.toString() !== data.sbu.toString()) {
    throw createError(
      "Designation does not belong to the selected SBU."
    );
  }

  if (
    designation.department?.toString() !==
    data.department.toString()
  ) {
    throw createError(
      "Designation does not belong to the selected department."
    );
  }
}

class PositionService {
  async createPosition(companyId, payload) {
    const data = {
      ...cleanPositionPayload(payload),
      company: companyId,
    };

    validateCreatePosition(data);
    await validateRelations(companyId, data);
    await this.validateParent(companyId, data.reportsTo);

    return PositionRepository.create(data);
  }

  async listPositions(companyId) {
    return PositionRepository.findAll(companyId);
  }

  async getPosition(id, companyId) {
    assertId(id, "Position id");

    const position = await PositionRepository.findById(
      id,
      companyId
    );

    if (!position) {
      throw createError("Position not found", 404);
    }

    return position;
  }

  async updatePosition(id, companyId, payload) {
    assertId(id, "Position id");

    const existing = await PositionRepository.findById(
      id,
      companyId
    );

    if (!existing) {
      throw createError("Position not found", 404);
    }

    const data = cleanPositionPayload(payload);

    for (const field of ["sbu", "department", "designation"]) {
      if (data[field] === undefined) {
        data[field] = existing[field]?._id || existing[field];
      }
    }

    await validateRelations(companyId, data);

    if (data.reportsTo?.toString() === id.toString()) {
      throw createError("A position cannot report to itself.");
    }

    await this.validateParent(companyId, data.reportsTo);

    return PositionRepository.update(id, companyId, data);
  }

  async validateParent(companyId, reportsTo) {
    if (!reportsTo) {
      return;
    }

    assertId(reportsTo, "reportsTo");

    const parent = await PositionRepository.findById(
      reportsTo,
      companyId
    );

    if (!parent) {
      throw createError(
        "Parent position is not available in this company."
      );
    }
  }

  async deletePosition(id, companyId) {
    assertId(id, "Position id");

    const position = await PositionRepository.deactivate(
      id,
      companyId
    );

    if (!position) {
      throw createError("Position not found", 404);
    }

    return position;
  }

  async assignEmployee(positionId, employeeId, companyId) {
    assertId(positionId, "Position id");
    assertId(employeeId, "Employee id");

    const position = await PositionRepository.findById(
      positionId,
      companyId
    );

    if (!position) {
      throw createError("Position not found", 404);
    }

    if (position.occupant) {
      throw createError("Position is already occupied.");
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
      active: true,
      deletedAt: null,
    }).select("_id position");

    if (!employee) {
      throw createError(
        "Employee is not available in this company."
      );
    }

    if (employee.position) {
      await PositionRepository.vacate(
        employee.position,
        companyId
      );
    }

    return PositionRepository.assignEmployee(
      positionId,
      companyId,
      employeeId
    );
  }

  async vacatePosition(positionId, companyId) {
    assertId(positionId, "Position id");
    return PositionRepository.vacate(positionId, companyId);
  }
}

export default new PositionService();
