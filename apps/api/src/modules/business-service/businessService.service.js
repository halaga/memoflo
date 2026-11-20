import BusinessServiceRepository from "./businessService.repository.js";
import { validateCreateBusinessService, } from "./businessService.validator.js";
class BusinessServiceService {
    async createBusinessService(companyId, payload) {
        validateCreateBusinessService(payload);
        return BusinessServiceRepository.create({
            ...payload,
            company: companyId,
        });
    }
    async listBusinessServices(companyId) {
        return BusinessServiceRepository.findAll(companyId);
    }
    async getBusinessService(companyId, id) {
        const businessService = await BusinessServiceRepository.findById(id, companyId);
        if (!businessService) {
            throw new Error("Business service not found");
        }
        return businessService;
    }
    async getBusinessServiceBySlug(companyId, slug) {
        const businessService = await BusinessServiceRepository.findBySlug(slug, companyId);
        if (!businessService) {
            throw new Error("Business service not found");
        }
        return businessService;
    }
    async updateBusinessService(companyId, id, payload) {
        const existing = await BusinessServiceRepository.findById(id, companyId);
        if (!existing) {
            throw new Error("Business service not found");
        }
        const safePayload = { ...payload };
        delete safePayload.company;
        validateCreateBusinessService({ ...existing.toObject(), ...safePayload });
        const businessService = await BusinessServiceRepository.update(id, companyId, safePayload);
        if (!businessService) {
            throw new Error("Business service not found");
        }
        return businessService;
    }
    async deleteBusinessService(companyId, id) {
        const businessService = await BusinessServiceRepository.deactivate(id, companyId);
        if (!businessService) {
            throw new Error("Business service not found");
        }
        return businessService;
    }
}
export default new BusinessServiceService();
