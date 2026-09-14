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

    const company = companyDoc.toObject
      ? companyDoc.toObject()
      : companyDoc;

    const enabled = Array.isArray(company.settings?.modules)
      ? company.settings.modules
      : [];

    const configuredBranding =
      company.settings?.branding || {};

    const branding = {
      logo:
        configuredBranding.logo ||
        company.logo ||
        "",
      wallpaper:
        configuredBranding.wallpaper ||
        "",
      primaryColor:
        configuredBranding.primaryColor ||
        company.primaryColor ||
        "#2563EB",
      secondaryColor:
        configuredBranding.secondaryColor ||
        company.secondaryColor ||
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

    const configuredBranding =
      object.settings?.branding || {};

    return {
      name: object.name,
      code: object.code,
      slug: object.slug,
      logo:
        configuredBranding.logo ||
        object.logo ||
        "",
      wallpaper:
        configuredBranding.wallpaper ||
        "",
      primaryColor:
        configuredBranding.primaryColor ||
        object.primaryColor ||
        "#2563EB",
      secondaryColor:
        configuredBranding.secondaryColor ||
        object.secondaryColor ||
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
        allowed[key] = String(
          branding[key] || ""
        ).trim();
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
