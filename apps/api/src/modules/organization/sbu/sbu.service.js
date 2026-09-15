import mongoose from "mongoose";
import SBURepository from "./sbu.repository.js";

function assertId(value, label) {
  if (!value || !mongoose.isValidObjectId(value)) {
    const error = new Error(`${label} must be a valid id`);
    error.status = 400;
    throw error;
  }
}

function cleanPayload(payload = {}) {
  const allowed = ["name", "code", "description", "head"];
  const output = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      output[key] = payload[key];
    }
  }
  if (typeof output.name === "string") output.name = output.name.trim();
  if (typeof output.code === "string") output.code = output.code.trim().toUpperCase();
  if (output.head === "") output.head = null;
  return output;
}

class SBUService {
  async listSBUs(companyId) {
    return SBURepository.findAll(companyId);
  }

  async getSBU(id, companyId) {
    assertId(id, "SBU id");
    const sbu = await SBURepository.findById(id, companyId);
    if (!sbu) {
      const error = new Error("SBU not found");
      error.status = 404;
      throw error;
    }
    return sbu;
  }

  async createSBU(companyId, payload) {
    const data = cleanPayload(payload);
    if (!data.name) {
      const error = new Error("SBU name is required");
      error.status = 400;
      throw error;
    }
    return SBURepository.create({ ...data, company: companyId });
  }

  async updateSBU(id, companyId, payload) {
    assertId(id, "SBU id");
    const data = cleanPayload(payload);
    if (data.name !== undefined && !data.name) {
      const error = new Error("SBU name is required");
      error.status = 400;
      throw error;
    }

    const sbu = await SBURepository.update(id, companyId, data);
    if (!sbu) {
      const error = new Error("SBU not found");
      error.status = 404;
      throw error;
    }
    return sbu;
  }

  async deleteSBU(id, companyId) {
    assertId(id, "SBU id");
    const sbu = await SBURepository.deactivate(id, companyId);
    if (!sbu) {
      const error = new Error("SBU not found");
      error.status = 404;
      throw error;
    }
    return sbu;
  }
}

export default new SBUService();
