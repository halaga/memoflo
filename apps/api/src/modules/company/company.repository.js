import Company from "./company.model.js";

class CompanyRepository {
  async findById(id) { return Company.findById(id); }

  async updateModules(id, modules) {
    return Company.findByIdAndUpdate(
      id,
      { $set: { "settings.modules": modules } },
      { new: true, runValidators: true }
    );
  }
}

export default new CompanyRepository();
