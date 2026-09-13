import Memo from "./memo.model.js";

class MemoRepository {
  async create(data) {
    return Memo.create(data);
  }

  async findAll(companyId) {
    return Memo.find({ company: companyId, isActive: true, deletedAt: null })
      .populate("createdBy", "_id firstName lastName email")
      .populate("businessService")
      .populate("requestingSbu", "_id name code")
      .populate("beneficiarySBU", "_id name code")
      .populate("currentApprover")
      .populate("workflow")
      .sort({ createdAt: -1 });
  }

  async findById(id, companyId = null) {
    const filter = { _id: id, isActive: true, deletedAt: null };
    if (companyId) filter.company = companyId;

    return Memo.findOne(filter)
      .populate("createdBy", "_id firstName lastName email")
      .populate("businessService")
      .populate("requestingSbu", "_id name code")
      .populate("beneficiarySBU", "_id name code")
      .populate("currentApprover")
      .populate("workflow")
      .populate("workflowInstance");
  }

  async update(id, companyId, data) {
    return Memo.findOneAndUpdate(
      { _id: id, company: companyId, isActive: true, deletedAt: null },
      data,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "_id firstName lastName email")
      .populate("businessService")
      .populate("requestingSbu", "_id name code")
      .populate("beneficiarySBU", "_id name code")
      .populate("currentApprover")
      .populate("workflow")
      .populate("workflowInstance");
  }
}

export default new MemoRepository();
