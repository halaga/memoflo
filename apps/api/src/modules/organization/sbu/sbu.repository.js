import SBU from "./sbu.model.js";

const populateHead = (query) =>
  query.populate("head", "_id firstName lastName email");

class SBURepository {
  async findAll(companyId) {
    return populateHead(
      SBU.find({
        company: companyId,
        isActive: true,
        deletedAt: null,
      }).sort({ name: 1 })
    );
  }

  async findById(id, companyId) {
    return populateHead(
      SBU.findOne({
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      })
    );
  }

  async create(payload) {
    return SBU.create(payload);
  }

  async update(id, companyId, payload) {
    return populateHead(
      SBU.findOneAndUpdate(
        {
          _id: id,
          company: companyId,
          isActive: true,
          deletedAt: null,
        },
        payload,
        {
          new: true,
          runValidators: true,
        }
      )
    );
  }

  async deactivate(id, companyId) {
    return SBU.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      },
      {
        isActive: false,
        deletedAt: new Date(),
      },
      { new: true }
    );
  }
}

export default new SBURepository();
