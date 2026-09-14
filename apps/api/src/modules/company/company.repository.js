import Company from "./company.model.js";

class CompanyRepository {
  async findById(id) { return Company.findById(id); }
  async findBySlug(slug) { return Company.findOne({ slug: String(slug).toLowerCase(), active: { $ne: false } }); }
  async updateModules(id, modules) {
    return Company.findByIdAndUpdate(id, { $set: { "settings.modules": modules } }, { new: true, runValidators: true });
  }
  async updateBranding(id, branding) {
    return Company.findByIdAndUpdate(id, { $set: { "settings.branding": branding } }, { new: true, runValidators: true });
  }
}
export default new CompanyRepository();
