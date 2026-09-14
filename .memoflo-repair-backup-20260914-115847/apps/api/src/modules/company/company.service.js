import CompanyRepository from "./company.repository.js";
import {
  ALL_MODULE_IDS,
  MODULE_CATALOGUE,
} from "./module.catalogue.js";

class CompanyService {
  async getWorkspace(companyId) {
    const companyDoc = await CompanyRepository.findById(companyId);

    if (!companyDoc) {
      throw new Error("Company not found");
    }

    // CompanyRepository.findById() returns a Mongoose document.
    // Do not call .lean() on the Promise returned by the repository.
    const company = companyDoc.toObject
      ? companyDoc.toObject()
      : companyDoc;

    const enabled = Array.isArray(company.settings?.modules)
      ? company.settings.modules
      : [];

    const branding = {
      logo:
        company.logo ||
        company.settings?.branding?.logo ||
        "",
      wallpaper:
        company.settings?.branding?.wallpaper ||
        "",
      primaryColor:
        company.primaryColor ||
        company.settings?.branding?.primaryColor ||
        "#2563EB",
      secondaryColor:
        company.secondaryColor ||
        company.settings?.branding?.secondaryColor ||
        "#1E293B",
    };

    return {
      company: {
        ...company,
        branding,
      },
      modules: MODULE_CATALOGUE.map((module) => ({
        ...module,
        enabled: enabled.includes(module.id),
      })),
    };
  }

  async getPublicBySlug(slug) {
    const company = await CompanyRepository.findBySlug(slug);

    if (!company) {
      throw new Error("Company tenant not found");
    }

    const object = company.toObject
      ? company.toObject()
      : company;

    return {
      name: object.name,
      code: object.code,
      slug: object.slug,
      logo:
        object.logo ||
        object.settings?.branding?.logo ||
        "",
      wallpaper:
        object.settings?.branding?.wallpaper ||
        "",
      primaryColor:
        object.primaryColor ||
        object.settings?.branding?.primaryColor ||
        "#2563EB",
      secondaryColor:
        object.secondaryColor ||
        object.settings?.branding?.secondaryColor ||
        "#1E293B",
    };
  }

  async updateModules(companyId, requestedModules = []) {
    if (!Array.isArray(requestedModules)) {
      throw new Error("Modules must be an array");
    }

    const invalid = requestedModules.filter(
      (id) => !ALL_MODULE_IDS.includes(id)
    );

    if (invalid.length) {
      throw new Error(
        `Unknown modules: ${invalid.join(", ")}`
      );
    }

    await CompanyRepository.updateModules(
      companyId,
      [...new Set(requestedModules)]
    );

    return this.getWorkspace(companyId);
  }

  async updateBranding(companyId, branding = {}) {
    const allowed = {};

    for (const key of [
      "logo",
      "wallpaper",
      "primaryColor",
      "secondaryColor",
    ]) {
      if (branding[key] !== undefined) {
        allowed[key] = String(branding[key] || "").trim();
      }
    }

    await CompanyRepository.updateBranding(
      companyId,
      allowed
    );

    return this.getWorkspace(companyId);
  }
}

export default new CompanyService();
