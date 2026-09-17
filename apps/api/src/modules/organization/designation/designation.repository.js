import Designation from "./designation.model.js";

const populateDesignation = (query) =>
  query
    .populate("sbu", "name code")
    .populate("department", "name code");

class DesignationRepository {
  async create(data) {
    return Designation.create(data);
  }

  async findAll(companyId) {
    return populateDesignation(
      Designation.find({
        company: companyId,
        isActive: true,
        deletedAt: null,
      }).sort({ title: 1 })
    );
  }

  async findById(id, companyId) {
    return populateDesignation(
      Designation.findOne({
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      })
    );
  }

  async update(id, companyId, data) {
    return populateDesignation(
      Designation.findOneAndUpdate(
        {
          _id: id,
          company: companyId,
          isActive: true,
          deletedAt: null,
        },
        data,
        {
          new: true,
          runValidators: true,
        }
      )
    );
  }

  async deactivate(id, companyId) {
    return Designation.findOneAndUpdate(
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

export default new DesignationRepository();
