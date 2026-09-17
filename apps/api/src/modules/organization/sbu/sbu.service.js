import mongoose from "mongoose";

import SBURepository from "./sbu.repository.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id, label = "SBU id") {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`${label} must be a valid id`);
  }
}

function cleanPayload(payload = {}) {
  const allowedFields = [
    "name",
    "code",
    "description",
    "head",
  ];
  const data = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = payload[field];
    }
  }

  if (typeof data.name === "string") {
    data.name = data.name.trim();
  }

  if (typeof data.code === "string") {
    data.code = data.code.trim().toUpperCase();
  }

  if (data.head === "") {
    data.head = null;
  }

  if (
    data.head !== undefined &&
    data.head !== null &&
    !mongoose.isValidObjectId(data.head)
  ) {
    throw createError("head must be a valid employee id");
  }

  return data;
}

class SBUService {
  async listSBUs(companyId) {
    return SBURepository.findAll(companyId);
  }

  async getSBU(id, companyId) {
    assertId(id);

    const sbu = await SBURepository.findById(id, companyId);

    if (!sbu) {
      throw createError("SBU not found", 404);
    }

    return sbu;
  }

  async createSBU(companyId, payload) {
    const data = cleanPayload(payload);

    if (!data.name) {
      throw createError("SBU name is required");
    }

    return SBURepository.create({
      ...data,
      company: companyId,
    });
  }

  async updateSBU(id, companyId, payload) {
    assertId(id);

    const data = cleanPayload(payload);

    if (data.name !== undefined && !data.name) {
      throw createError("SBU name is required");
    }

    const sbu = await SBURepository.update(
      id,
      companyId,
      data
    );

    if (!sbu) {
      throw createError("SBU not found", 404);
    }

    return sbu;
  }

  async deleteSBU(id, companyId) {
    assertId(id);

    const sbu = await SBURepository.deactivate(
      id,
      companyId
    );

    if (!sbu) {
      throw createError("SBU not found", 404);
    }

    return sbu;
  }
}

export default new SBUService();
