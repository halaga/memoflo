import SBU from "./sbu.model.js";

class SBURepository {
  async findAll(companyId) {
    return SBU.find({
      company: companyId,
      isActive: true,
      deletedAt: null,
    })
      .populate("head", "_id firstName lastName email")
      .sort({ name: 1 });
  }

  async findById(id, companyId) {
    return SBU.findOne({
      _id: id,
      company: companyId,
      isActive: true,
      deletedAt: null,
    }).populate("head", "_id firstName lastName email");
  }
}

export default new SBURepository();
