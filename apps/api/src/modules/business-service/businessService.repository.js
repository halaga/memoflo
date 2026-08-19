import BusinessService from "./businessService.model.js";

class BusinessServiceRepository {
  async create(data) {
    return BusinessService.create(data);
  }

  async findAll(companyId) {
    return BusinessService.find({
      company: companyId,
      isActive: true,
      active: true,
    })
      .populate("ownerDepartment")
      .populate("workflow")
      .sort({
        category: 1,
        name: 1,
      });
  }

  async findById(id, companyId) {
    return BusinessService.findOne({
      _id: id,
      company: companyId,
      isActive: true,
      active: true,
    })
      .populate("ownerDepartment")
      .populate("workflow");
  }

  async findBySlug(slug, companyId) {
    return BusinessService.findOne({
      slug: slug.toLowerCase(),
      company: companyId,
      isActive: true,
      active: true,
    })
      .populate("ownerDepartment")
      .populate("workflow");
  }

  async update(id, companyId, data) {
    return BusinessService.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        active: true,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("ownerDepartment")
      .populate("workflow");
  }

  async deactivate(id, companyId) {
    return BusinessService.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        active: true,
      },
      {
        isActive: false,
        active: false,
      },
      {
        new: true,
      }
    );
  }

  async assignWorkflow(
    id,
    companyId,
    workflowId
  ) {
    return BusinessService.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        active: true,
      },
      {
        workflow: workflowId,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("ownerDepartment")
      .populate("workflow");
  }
}

export default new BusinessServiceRepository();