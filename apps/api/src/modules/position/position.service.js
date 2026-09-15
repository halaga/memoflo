import mongoose from "mongoose";
import PositionRepository from "./position.repository.js";
import { cleanPositionPayload, validateCreatePosition } from "./position.validator.js";
import SBU from "../organization/sbu/sbu.model.js";
import Department from "../organization/department/department.model.js";
import Designation from "../organization/designation/designation.model.js";
import Employee from "../employee/employee.model.js";

function bad(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function assertId(value, label) {
  if (!value || !mongoose.isValidObjectId(value)) bad(`${label} must be a valid id`);
}

async function validateRelations(companyId, data) {
  const [sbu, department, designation] = await Promise.all([
    SBU.findOne({ _id: data.sbu, company: companyId, isActive: true, deletedAt: null }).select("_id"),
    Department.findOne({ _id: data.department, company: companyId }).select("_id sbu"),
    Designation.findOne({ _id: data.designation, company: companyId }).select("_id department sbu"),
  ]);

  if (!sbu) bad("Selected SBU is not available in this company.");
  if (!department) bad("Selected department is not available in this company.");
  if (!designation) bad("Selected designation is not available in this company.");

  if (department.sbu && department.sbu.toString() !== data.sbu.toString()) {
    bad("Department does not belong to the selected SBU.");
  }

  if (designation.sbu && designation.sbu.toString() !== data.sbu.toString()) {
    bad("Designation does not belong to the selected SBU.");
  }

  if (designation.department && designation.department.toString() !== data.department.toString()) {
    bad("Designation does not belong to the selected department.");
  }
}

class PositionService {
  async createPosition(companyId, payload) {
    const data = { ...cleanPositionPayload(payload), company: companyId };
    validateCreatePosition(data);
    await validateRelations(companyId, data);

    if (data.reportsTo) {
      assertId(data.reportsTo, "reportsTo");
      const parent = await PositionRepository.findById(data.reportsTo, companyId);
      if (!parent) bad("Parent position is not available in this company.");
    }

    return PositionRepository.create(data);
  }

  async listPositions(companyId) {
    return PositionRepository.findAll(companyId);
  }

  async getPosition(id, companyId) {
    assertId(id, "Position id");
    const position = await PositionRepository.findById(id, companyId);
    if (!position) {
      const error = new Error("Position not found");
      error.status = 404;
      throw error;
    }
    return position;
  }

  async updatePosition(id, companyId, payload) {
    assertId(id, "Position id");

    const existing = await PositionRepository.findById(id, companyId);
    if (!existing) {
      const error = new Error("Position not found");
      error.status = 404;
      throw error;
    }

    const data = cleanPositionPayload(payload);

    for (const field of ["sbu", "department", "designation"]) {
      if (data[field] === undefined) {
        data[field] = existing[field]?._id || existing[field];
      }
    }

    await validateRelations(companyId, data);

    if (data.reportsTo && data.reportsTo.toString() === id.toString()) {
      bad("A position cannot report to itself.");
    }

    if (data.reportsTo) {
      const parent = await PositionRepository.findById(data.reportsTo, companyId);
      if (!parent) bad("Parent position is not available in this company.");
    }

    return PositionRepository.update(id, companyId, data);
  }

  async deletePosition(id, companyId) {
    assertId(id, "Position id");
    const position = await PositionRepository.deactivate(id, companyId);
    if (!position) {
      const error = new Error("Position not found");
      error.status = 404;
      throw error;
    }
    return position;
  }

  async assignEmployee(positionId, employeeId, companyId) {
    assertId(positionId, "Position id");
    assertId(employeeId, "Employee id");

    const position = await PositionRepository.findById(positionId, companyId);
    if (!position) {
      const error = new Error("Position not found");
      error.status = 404;
      throw error;
    }
    if (position.occupant) bad("Position already occupied.");

    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
    }).select("_id");
    if (!employee) bad("Employee is not available in this company.");

    return PositionRepository.assignEmployee(positionId, companyId, employeeId);
  }

  async vacatePosition(positionId, companyId) {
    assertId(positionId, "Position id");
    return PositionRepository.vacate(positionId, companyId);
  }
}

export default new PositionService();
