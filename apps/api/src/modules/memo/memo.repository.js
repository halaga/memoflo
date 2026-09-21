import Memo from "./memo.model.js";

class MemoRepository {
  async create(data) {
    return Memo.create(data);
  }

  async findAll(companyId) {
    return Memo.find({
      company: companyId,
      isActive: true,
      deletedAt: null,
    })
      .populate("createdBy", "_id firstName lastName email")
      .populate("businessService", "_id name category")
      .populate("currentApprover", "_id title code")
      .populate("workflow", "_id name");
  }

  async findById(id, companyId) {
    return Memo.findOne({
      _id: id,
      company: companyId,
      isActive: true,
      deletedAt: null,
    })
      .populate("createdBy", "_id firstName lastName email")
      .populate("businessService", "_id name category")
      .populate("workflow", "_id name");
  }

  async update(id, companyId, data) {
    return Memo.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        isActive: true,
        deletedAt: null,
      },
      data,
      { new: true, runValidators: true }
    );
  }
}

export default new MemoRepository();
