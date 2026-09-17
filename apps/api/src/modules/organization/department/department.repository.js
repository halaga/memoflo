import Department from "./department.model.js";

const populateDepartment = (query) =>
  query
    .populate("sbu", "name code")
    .populate("head", "firstName lastName email");

class DepartmentRepository {
  async create(data) {
    return Department.create(data);
  }

  async findAll(companyId) {
    return populateDepartment(
      Department.find({
        company: companyId,
        isActive: true,
        deletedAt: null,
      }).sort({ name: 1 })
    );
  }

  async findById(id, companyId) {
    return populateDepartment(
      Department.findOne({
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      })
    );
  }

  async update(id, companyId, data) {
    return populateDepartment(
      Department.findOneAndUpdate(
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
    return Department.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      },
      {
        isActive: false,
        active: false,
        deletedAt: new Date(),
      },
      { new: true }
    );
  }
}

export default new DepartmentRepository();
