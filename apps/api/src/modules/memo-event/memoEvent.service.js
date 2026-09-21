import MemoEvent from "./memoEvent.model.js";

const SAFE_METADATA_KEYS = new Set([
  "referenceNo",
  "workflow",
  "workflowInstance",
  "stepOrder",
  "stepName",
  "action",
  "position",
  "attachmentId",
  "fileName",
  "mimeType",
  "fileSize",
  "changedFields",
]);

function cleanMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => SAFE_METADATA_KEYS.has(key))
  );
}

class MemoEventService {
  async record({
    company,
    memo,
    actor = null,
    type,
    title,
    description,
    fromStatus = null,
    toStatus = null,
    workflowStep = null,
    comment = null,
    metadata = {},
  }) {
    if (!company || !memo || !type || !title || !description) {
      throw new Error("Memo event requires company, memo, type, title and description");
    }

    return MemoEvent.create({
      company,
      memo,
      actor,
      type,
      title,
      description,
      fromStatus,
      toStatus,
      workflowStep,
      comment: comment?.trim() || null,
      metadata: cleanMetadata(metadata),
    });
  }

  async list(company, memoId) {
    return MemoEvent.find({ company, memo: memoId })
      .populate("actor", "_id firstName lastName email")
      .populate("workflowStep", "_id name order action")
      .sort({ createdAt: -1 })
      .lean();
  }

  async listCompanyEvents(company, { page = 1, limit = 50, type = "" } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const filter = { company };

    if (type) filter.type = type;

    const [events, total] = await Promise.all([
      MemoEvent.find(filter)
        .populate("memo", "_id referenceNo title status")
        .populate("actor", "_id firstName lastName email")
        .populate("workflowStep", "_id name order action")
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      MemoEvent.countDocuments(filter),
    ]);

    return {
      events,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    };
  }
}

export default new MemoEventService();
