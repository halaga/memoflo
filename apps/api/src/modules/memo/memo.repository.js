import Memo from "./memo.model.js";

class MemoRepository {
  async create(data) {
    return Memo.create(data);
  }

  async findAll(company) {
    return Memo.find({
      company,
      deletedAt: null,
    })
      .populate("createdBy")
      .populate("businessService")
      .populate("currentApprover");
  }

  async findById(id) {
    return Memo.findById(id)
      .populate("createdBy")
      .populate("businessService")
      .populate("workflow");
  }

  async update(id, data) {
    return Memo.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
  }
}

export default new MemoRepository();