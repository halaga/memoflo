import DepartmentRepository from "./department.repository.js";
import { validateCreateDepartment } from "./department.validator.js";

class DepartmentService {
  async createDepartment(companyId, payload) {
    payload.company = companyId;

    validateCreateDepartment(payload);

    return DepartmentRepository.create(payload);
  }

  async listDepartments(companyId) {
    return DepartmentRepository.findAll(companyId);
  }

  async getDepartment(id) {
    return DepartmentRepository.findById(id);
  }

  async updateDepartment(id, payload) {
    return DepartmentRepository.update(id, payload);
  }

  async deleteDepartment(id) {
    return DepartmentRepository.deactivate(id);
  }
}

export default new DepartmentService();