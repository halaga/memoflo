import Designation from "./designation.model.js";

class DesignationRepository {
  create(data) {
    return Designation.create(data);
  }

  findAll(company) {
    return Designation.find({
      company,
      isActive: true,
    }).sort({ title: 1 });
  }

  findById(id) {
    return Designation.findById(id);
  }

  update(id, data) {
    return Designation.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
  }

  deactivate(id) {
    return Designation.findByIdAndUpdate(
      id,
      {
        isActive: false,
        deletedAt: new Date(),
      },
      { new: true }
    );
  }
}

export default new DesignationRepository();