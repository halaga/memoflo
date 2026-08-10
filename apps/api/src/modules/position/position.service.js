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

  async assignEmployee(positionId, employeeId, companyId) {
  const position =
    await PositionRepository.findById(positionId);

  if (!position) {
    throw new Error("Position not found");
  }

  if (position.company.toString() !== companyId.toString()) {
    throw new Error("Unauthorized position");
  }

  if (position.occupant) {
    throw new Error("Position already occupied");
  }

  return PositionRepository.assignEmployee(
    positionId,
    employeeId
  );
}

  async vacatePosition(positionId, companyId) {
  const position =
    await PositionRepository.findById(positionId);

  if (!position) {
    throw new Error("Position not found");
  }

  if (position.company.toString() !== companyId.toString()) {
    throw new Error("Unauthorized position");
  }

  return PositionRepository.vacate(positionId);
}

}

export default new PositionService();