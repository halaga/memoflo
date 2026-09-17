import Company from "./company.model.js";

class CompanyRepository {
  async findById(id) {
    return Company.findOne({
      _id: id,
      isActive: true,
      deletedAt: null,
    });
  }

  async findBySlug(slug) {
    return Company.findOne({
      slug: String(slug).toLowerCase(),
      isActive: true,
      deletedAt: null,
    });
  }

  async updateModules(companyId, modules) {
    return Company.findOneAndUpdate(
      {
        _id: companyId,
        isActive: true,
        deletedAt: null,
      },
      {
        $set: {
          "settings.modules": modules,
        },
      },
      { new: true, runValidators: true }
    );
  }

  async updateBranding(companyId, branding) {
    return Company.findOneAndUpdate(
      {
        _id: companyId,
        isActive: true,
        deletedAt: null,
      },
      {
        $set: {
          "settings.branding": branding,
        },
      },
      { new: true, runValidators: true }
    );
  }
}

export default new CompanyRepository();
