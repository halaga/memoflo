import PositionRepository from "./position.repository.js";
import { validateCreatePosition } from "./position.validator.js";

class PositionService {
  async createPosition(companyId, payload) {
    payload.company = companyId;

    validateCreatePosition(payload);

    return PositionRepository.create(payload);
  }

  async listPositions(companyId) {
    return PositionRepository.findAll(companyId);
  }

  async getPosition(id) {
    return PositionRepository.findById(id);
  }

  async updatePosition(id, payload) {
    return PositionRepository.update(id, payload);
  }

  async deletePosition(id) {
    return PositionRepository.deactivate(id);
  }

  async assignEmployee(positionId, employeeId) {
    return PositionRepository.update(positionId, {
      occupant: employeeId,
    });
  }

  async vacatePosition(positionId) {
    return PositionRepository.update(positionId, {
      occupant: null,
    });
  }
}

export default new PositionService();