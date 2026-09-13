import SBURepository from "./sbu.repository.js";

class SBUService {
  async listSBUs(companyId) {
    return SBURepository.findAll(companyId);
  }

  async getSBU(id, companyId) {
    const sbu = await SBURepository.findById(id, companyId);
    if (!sbu) throw new Error("SBU not found");
    return sbu;
  }
}

export default new SBUService();
