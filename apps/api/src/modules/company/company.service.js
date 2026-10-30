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
      tagline: configuredBranding.tagline || "Workflow, simplified.",
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
      tagline: configuredBranding.tagline || "Workflow, simplified.",
    };
  }

  async updateProfile(companyId, profile = {}) {
    const allowed = ["name", "email", "phone", "website", "industry", "address", "city", "state", "country", "timezone"];
    const cleaned = {};
    for (const key of allowed) {
      if (profile[key] === undefined) continue;
      const value = String(profile[key] ?? "").trim();
      const limits = { name: 120, email: 254, phone: 40, website: 200, industry: 80, address: 240, city: 80, state: 80, country: 80, timezone: 80 };
      if (value.length > limits[key]) throw new Error(`${key} is too long`);
      cleaned[key] = value;
    }
    if ("name" in cleaned && cleaned.name.length < 2) throw new Error("Company name must be at least 2 characters");
    if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) throw new Error("Enter a valid company email address");
    if (cleaned.website && !/^https?:\/\//i.test(cleaned.website)) throw new Error("Website must start with http:// or https://");
    if (cleaned.timezone) {
      try { new Intl.DateTimeFormat("en", { timeZone: cleaned.timezone }); }
      catch { throw new Error("Choose a valid time zone"); }
    }
    const updated = await CompanyRepository.updateProfile(companyId, cleaned);
    if (!updated) throw new Error("Company not found");
    return this.getWorkspace(companyId);
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
      "tagline",
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
