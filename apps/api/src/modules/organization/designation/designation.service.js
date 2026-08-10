import DesignationRepository from "./designation.repository.js";
import { validateCreateDesignation } from "./designation.validator.js";

class DesignationService {
  async createDesignation(company, payload) {
    payload.company = company;

    validateCreateDesignation(payload);

    return await DesignationRepository.create(payload);
  }

  async listDesignations(company) {
    return await DesignationRepository.findAll(company);
  }

  async getDesignation(id) {
    return await DesignationRepository.findById(id);
  }

  async updateDesignation(id, payload) {
    return await DesignationRepository.update(id, payload);
  }

  async deleteDesignation(id) {
    return await DesignationRepository.deactivate(id);
  }
}

export default new DesignationService();