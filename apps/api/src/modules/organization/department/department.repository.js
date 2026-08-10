import Department from "./department.model.js";

class DepartmentRepository {
  async create(data) {
    return Department.create(data);
  }

  async findAll(companyId) {
    return Department.find({
      company: companyId,
      isActive: true,
    })
      .populate("sbu", "name code")
      .populate("head", "firstName lastName email")
      .sort({ name: 1 });
  }

  async findById(id) {
    return Department.findOne({
      _id: id,
      isActive: true,
    })
      .populate("sbu", "name code")
      .populate("head", "firstName lastName email");
  }

  async update(id, data) {
    return Department.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
  }

  async deactivate(id) {
    return Department.findByIdAndUpdate(
      id,
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