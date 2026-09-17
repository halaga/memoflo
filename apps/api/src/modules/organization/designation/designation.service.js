import mongoose from "mongoose";

import DesignationRepository from "./designation.repository.js";
import { validateCreateDesignation } from "./designation.validator.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id, label = "Designation id") {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`${label} must be a valid id`);
  }
}

class DesignationService {
  async createDesignation(companyId, payload) {
    const data = {
      ...payload,
      company: companyId,
    };

    validateCreateDesignation(data);
    return DesignationRepository.create(data);
  }

  async listDesignations(companyId) {
    return DesignationRepository.findAll(companyId);
  }

  async getDesignation(id, companyId) {
    assertId(id);

    const designation = await DesignationRepository.findById(
      id,
      companyId
    );

    if (!designation) {
      throw createError("Designation not found", 404);
    }

    return designation;
  }

  async updateDesignation(id, companyId, payload) {
    assertId(id);

    const data = { ...payload };
    delete data.company;

    const designation = await DesignationRepository.update(
      id,
      companyId,
      data
    );

    if (!designation) {
      throw createError("Designation not found", 404);
    }

    return designation;
  }

  async deleteDesignation(id, companyId) {
    assertId(id);

    const designation = await DesignationRepository.deactivate(
      id,
      companyId
    );

    if (!designation) {
      throw createError("Designation not found", 404);
    }

    return designation;
  }
}

export default new DesignationService();
