import mongoose from "mongoose";

import DepartmentRepository from "./department.repository.js";
import { validateCreateDepartment } from "./department.validator.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id, label = "Department id") {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`${label} must be a valid id`);
  }
}

class DepartmentService {
  async createDepartment(companyId, payload) {
    const data = {
      ...payload,
      company: companyId,
    };

    validateCreateDepartment(data);
    return DepartmentRepository.create(data);
  }

  async listDepartments(companyId) {
    return DepartmentRepository.findAll(companyId);
  }

  async getDepartment(id, companyId) {
    assertId(id);

    const department = await DepartmentRepository.findById(
      id,
      companyId
    );

    if (!department) {
      throw createError("Department not found", 404);
    }

    return department;
  }

  async updateDepartment(id, companyId, payload) {
    assertId(id);

    const data = { ...payload };
    delete data.company;

    const department = await DepartmentRepository.update(
      id,
      companyId,
      data
    );

    if (!department) {
      throw createError("Department not found", 404);
    }

    return department;
  }

  async deleteDepartment(id, companyId) {
    assertId(id);

    const department = await DepartmentRepository.deactivate(
      id,
      companyId
    );

    if (!department) {
      throw createError("Department not found", 404);
    }

    return department;
  }
}

export default new DepartmentService();
