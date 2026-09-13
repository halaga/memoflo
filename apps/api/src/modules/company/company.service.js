import CompanyRepository from "./company.repository.js";
import { ALL_MODULE_IDS, MODULE_CATALOGUE } from "./module.catalogue.js";

class CompanyService {
  async getWorkspace(companyId) {
    const company = await CompanyRepository.findById(companyId).lean();
    if (!company) throw new Error("Company not found");

    const enabled = Array.isArray(company.settings?.modules)
      ? company.settings.modules
      : [];

    return {
      company,
      modules: MODULE_CATALOGUE.map((module) => ({
        ...module,
        enabled: enabled.includes(module.id),
      })),
    };
  }

  async updateModules(companyId, requestedModules = []) {
    if (!Array.isArray(requestedModules)) throw new Error("Modules must be an array");
    const invalid = requestedModules.filter((id) => !ALL_MODULE_IDS.includes(id));
    if (invalid.length) throw new Error(`Unknown modules: ${invalid.join(", ")}`);

    const company = await CompanyRepository.updateModules(
      companyId,
      [...new Set(requestedModules)]
    );
    if (!company) throw new Error("Company not found");
    return this.getWorkspace(companyId);
  }
}

export default new CompanyService();
