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

  async updateProfile(companyId, profile) {
    return Company.findOneAndUpdate(
      { _id: companyId, isActive: true, deletedAt: null },
      { $set: profile },
      { new: true, runValidators: true }
    );
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

  async updateSignature(companyId, signature) {
    const updates = {};
    for (const [key, value] of Object.entries(signature)) {
      if (key === "socials" && value && typeof value === "object") {
        for (const [social, url] of Object.entries(value)) updates[`settings.signature.socials.${social}`] = url;
      } else {
        updates[`settings.signature.${key}`] = value;
      }
    }
    return Company.findOneAndUpdate(
      { _id: companyId, isActive: true, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }
}

export default new CompanyRepository();
