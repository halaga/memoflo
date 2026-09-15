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

  async create(payload) {
    return SBU.create(payload);
  }

  async update(id, companyId, payload) {
    return SBU.findOneAndUpdate(
      { _id: id, company: companyId, isActive: true, deletedAt: null },
      payload,
      { new: true, runValidators: true }
    ).populate("head", "_id firstName lastName email");
  }

  async deactivate(id, companyId) {
    return SBU.findOneAndUpdate(
      { _id: id, company: companyId, isActive: true, deletedAt: null },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );
  }
}

export default new SBURepository();
