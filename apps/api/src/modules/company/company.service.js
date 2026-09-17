import CompanyRepository from "./company.repository.js";
import {
  ALL_MODULE_IDS,
  MODULE_CATALOGUE,
} from "./module.catalogue.js";

const DEFAULT_BRANDING = {
  primaryColor: "#2563EB",
  secondaryColor: "#1E293B",
};

class CompanyService {
  async getWorkspace(companyId) {
    const companyDoc = await CompanyRepository.findById(companyId);

    if (!companyDoc) {
      throw new Error("Company not found");
    }

    const company = companyDoc.toObject
      ? companyDoc.toObject()
      : companyDoc;

    const enabledModules = Array.isArray(company.settings?.modules)
      ? company.settings.modules
      : [];

    const configuredBranding = company.settings?.branding || {};

    const branding = {
      logo: configuredBranding.logo || company.logo || "",
      wallpaper: configuredBranding.wallpaper || "",
      primaryColor:
        configuredBranding.primaryColor ||
        company.primaryColor ||
        DEFAULT_BRANDING.primaryColor,
      secondaryColor:
        configuredBranding.secondaryColor ||
        company.secondaryColor ||
        DEFAULT_BRANDING.secondaryColor,
    };

    return {
      company: {
        ...company,
        branding,
      },
      modules: MODULE_CATALOGUE.map((module) => ({
        ...module,
        enabled: enabledModules.includes(module.id),
      })),
    };
  }

  async getPublicBySlug(slug) {
    const company = await CompanyRepository.findBySlug(slug);

    if (!company) {
      throw new Error("Company tenant not found");
    }

    const object = company.toObject ? company.toObject() : company;
    const configuredBranding = object.settings?.branding || {};

    return {
      name: object.name,
      code: object.code,
      slug: object.slug,
      logo: configuredBranding.logo || object.logo || "",
      wallpaper: configuredBranding.wallpaper || "",
      primaryColor:
        configuredBranding.primaryColor ||
        object.primaryColor ||
        DEFAULT_BRANDING.primaryColor,
      secondaryColor:
        configuredBranding.secondaryColor ||
        object.secondaryColor ||
        DEFAULT_BRANDING.secondaryColor,
    };
  }

  async updateModules(companyId, requestedModules = []) {
    if (!Array.isArray(requestedModules)) {
      throw new Error("Modules must be an array");
    }

    const invalidModules = requestedModules.filter(
      (id) => !ALL_MODULE_IDS.includes(id)
    );

    if (invalidModules.length) {
      throw new Error(
        `Unknown modules: ${invalidModules.join(", ")}`
      );
    }

    await CompanyRepository.updateModules(
      companyId,
      [...new Set(requestedModules)]
    );

    return this.getWorkspace(companyId);
  }

  async updateBranding(companyId, branding = {}) {
    const allowedKeys = [
      "logo",
      "wallpaper",
      "primaryColor",
      "secondaryColor",
    ];

    const cleanedBranding = {};

    for (const key of allowedKeys) {
      if (branding[key] !== undefined) {
        cleanedBranding[key] = String(branding[key] || "").trim();
      }
    }

    await CompanyRepository.updateBranding(
      companyId,
      cleanedBranding
    );

    return this.getWorkspace(companyId);
  }
}

export default new CompanyService();
